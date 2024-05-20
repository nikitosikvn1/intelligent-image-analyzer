use std::io::Cursor;
use candle_core::{DType, Device, Result, Tensor};
use image::{DynamicImage, ImageBuffer, ImageResult, Rgb};
use image::io::Reader as ImageReader;
use image::imageops::FilterType;

/// Processes an image from raw bytes into an [`ImageBuffer`] of RGB values.
///
/// This function takes a byte slice representing an image, reads it into a [`DynamicImage`],
/// resizes it to a 384x384 image using the Triangle filter, and then converts it to an [`ImageBuffer`]
/// of RGB values.
///
/// # Arguments
///
/// * `image_bytes` - A byte slice representing the image to be processed.
///
/// # Returns
///
/// * [`ImageResult<ImageBuffer<Rgb<u8>, Vec<u8>>>`] - An [`ImageResult`] containing the processed [`ImageBuffer`],
/// or an [`image::ImageError`] if the image could not be processed.
///
/// # Examples
///
/// ```
/// let image_bytes: Vec<u8> = fs::read("path/to/image.jpg")?;
/// let image_buffer: ImageBuffer<Rgb<u8>, Vec<u8>> = process_image(&image_bytes)?;
/// image_buffer.save("path/to/save/processed_image.jpg")?;
/// ```
pub fn process_image(image_bytes: &[u8]) -> ImageResult<ImageBuffer<Rgb<u8>, Vec<u8>>> {
    let image_cursor: Cursor<&[u8]> = Cursor::new(image_bytes);
    let image: DynamicImage = ImageReader::new(image_cursor)
        .with_guessed_format()?
        .decode()?;

    let image_buf: ImageBuffer<Rgb<u8>, Vec<u8>> = image
        .resize_to_fill(384, 384, FilterType::Triangle)
        .to_rgb8();

    Ok(image_buf)
}

/// Creates a tensor from a byte slice representing pixel data.
///
/// This function takes a byte slice and a [`Device`], creates a tensor from the raw buffer,
/// permutes the dimensions, and then normalizes the tensor by subtracting the mean and dividing
/// by the standard deviation.
///
/// # Arguments
///
/// * `pixels` - A byte slice representing the pixel data.
/// * `device` - A [`Device`] to which the tensor will be allocated.
///
/// # Returns
///
/// * [`Result<Tensor>`] - A [`Result`] containing the created [`Tensor`], or an error if the tensor could not be created.
///
/// # Examples
///
/// ```
/// let image: DynamicImage = ImageReader::open("path/to/image.jpg")?
///     .decode()?;
///
/// let image_raw_buf: Vec<u8> = image.to_rgb8().into_raw();
/// let tensor: Tensor = create_tensor(&image_raw_buf, &Device::Cpu)?;
/// 
/// assert_eq!(tensor.shape().dims(), &[3, 384, 384]);
/// ```
pub fn create_tensor(pixels: &[u8], device: &Device) -> Result<Tensor> {
    let data = Tensor::from_raw_buffer(pixels, DType::U8, &[384, 384, 3], device)?
        .permute((2, 0, 1))?;
    let mean = Tensor::new(&[0.48145466_f32, 0.4578275, 0.40821073], device)?
        .reshape((3, 1, 1))?;
    let std = Tensor::new(&[0.26862954_f32, 0.2613026, 0.2757771], device)?
        .reshape((3, 1, 1))?;

    // Normalize the data tensor by subtracting the mean and dividing by the standard deviation
    (data.to_dtype(DType::F32)? / 255.)?
        .broadcast_sub(&mean)?
        .broadcast_div(&std)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageFormat, ImageError};

    #[test]
    fn test_process_image_ok() {
        // GIVEN
        let input_image: ImageBuffer<Rgb<u16>, Vec<u16>> =
            ImageBuffer::from_par_fn(800, 800, |_, y| {
                if y < 400 {
                    Rgb([u16::MAX, 0, 0])
                } else {
                    Rgb([0, 0, 0])
                }
            });

        let mut image_bytes: Cursor<Vec<u8>> = Cursor::new(Vec::new());
        input_image
            .write_to(&mut image_bytes, ImageFormat::Png)
            .unwrap();
        // WHEN
        let image_buf: ImageBuffer<Rgb<u8>, Vec<u8>> = process_image(image_bytes.get_ref()).unwrap();
        // THEN
        assert_eq!(image_buf.dimensions(), (384, 384));
        assert_eq!(image_buf.get_pixel(0, 0)[0], u8::MAX);
    }

    #[test]
    fn test_process_image_invalid_format() {
        // GIVEN
        let image_bytes: &[u8] = &[0, 1, 2, 3, 4, 5];
        // WHEN
        let processing_result: ImageResult<ImageBuffer<Rgb<u8>, Vec<u8>>> = process_image(image_bytes);
        // THEN
        assert!(processing_result.is_err());
        assert!(matches!(
            processing_result.unwrap_err(),
            ImageError::Unsupported(_),
        ));
    }

    #[test]
    fn test_process_image_fail_decode() {
        // GIVEN
        let mut image_bytes: Vec<u8> = vec![137, 80, 78, 71, 13, 10, 26, 10]; // PNG header
        image_bytes.extend_from_slice(&[0; 100]); // Random data
        // WHEN
        let processing_result: ImageResult<ImageBuffer<Rgb<u8>, Vec<u8>>> = process_image(&image_bytes);
        // THEN
        assert!(processing_result.is_err());
        assert!(matches!(
            processing_result.unwrap_err(),
            ImageError::Decoding(_),
        ));
    }

    #[test]
    fn test_create_tensor_ok() {
        // GIVEN
        let pixels: Vec<u8> = vec![0; 384 * 384 * 3];
        // WHEN
        let tensor: Tensor = create_tensor(&pixels, &Device::Cpu).unwrap();
        // THEN
        assert_eq!(tensor.shape().dims(), &[3, 384, 384]);
    }
}
