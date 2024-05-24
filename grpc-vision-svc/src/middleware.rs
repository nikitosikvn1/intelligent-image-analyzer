use std::pin::Pin;
use std::future::Future;
use std::task::{Context, Poll};
use tonic::body::BoxBody;
use tonic::transport::Body;
use tonic::server::NamedService;
use tower::{Service, Layer};

type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

#[derive(Debug, Clone, Default)]
pub struct ValidationLayer;

impl<S> Layer<S> for ValidationLayer {
    type Service = ValidationMiddleware<S>;

    fn layer(&self, service: S) -> Self::Service {
        ValidationMiddleware { inner: service }
    }
}

#[derive(Debug, Clone)]
pub struct ValidationMiddleware<S> {
    inner: S,
}

impl<S> Service<hyper::Request<Body>> for ValidationMiddleware<S>
where
    S: Service<hyper::Request<Body>, Response = hyper::Response<BoxBody>> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: hyper::Request<Body>) -> Self::Future {
        let clone: S = self.inner.clone();
        let mut inner: S = std::mem::replace(&mut self.inner, clone);

        Box::pin(async move {
            // TODO: Add validation logic here
            // Do extra async work here...
            let response = inner.call(req).await?;

            Ok(response)
        })
    }
}

impl<S: NamedService> NamedService for ValidationMiddleware<S> {
    const NAME: &'static str = S::NAME;
}
