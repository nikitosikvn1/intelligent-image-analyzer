use candle_core::{Device, Result};
#[cfg(test)]
use mockall::automock;

/// A trait for device utilities. Primarily used for DI & mocking in tests.
#[cfg_attr(test, automock)]
pub trait DeviceUtils {
    fn cuda_is_available(&self) -> bool;
    fn metal_is_available(&self) -> bool;
}

/// A default implementation of the [`DeviceUtils`] trait.
/// This implementation uses the [`candle_core`] crate to check if CUDA
/// and Metal are available on the device (requires the `cuda` or `metal` features to be enabled).
pub struct DefaultDeviceUtils;

impl DeviceUtils for DefaultDeviceUtils {
    fn cuda_is_available(&self) -> bool {
        candle_core::utils::cuda_is_available()
    }

    fn metal_is_available(&self) -> bool {
        candle_core::utils::metal_is_available()
    }
}

/// Selects the computing device based on the given preferences.
///
/// # Arguments
///
/// * `cpu` - A boolean indicating whether CPU is preferred over GPU.
/// * `device_utils` - An implementation of the [`DeviceUtils`] trait.
///
/// # Returns
///
/// Returns a [`Result`] containing the selected [`Device`] if successful, or an error if the selection fails.
///
/// # Examples
///
/// ```
/// // Select CPU as the computing device.
/// let device: Device = select_computing_device(true, &DefaultDeviceUtils).unwrap();
/// assert!(device.is_cpu());
///
/// // Select GPU (CUDA) as the computing device.
/// // This example assumes that the `cuda` feature is enabled.
/// let device: Device = select_computing_device(false, &DefaultDeviceUtils).unwrap();
/// assert!(matches!(device, Device::Cuda(_)));
/// ```
pub fn select_computing_device(cpu: bool, utils: &impl DeviceUtils) -> Result<Device> {
    if cpu {
        return Ok(Device::Cpu);
    }
    if utils.cuda_is_available() {
        return Device::new_cuda(0);
    }
    if utils.metal_is_available() {
        return Device::new_metal(0);
    }
    if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        tracing::info!(
            "Running on CPU, to run on GPU (metal), build this example with `--features metal`"
        );
    } else {
        tracing::info!(
            "Running on CPU, to run on GPU (CUDA), build this example with `--features cuda`"
        );
    }
    Ok(Device::Cpu)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_select_computing_device_cpu_preference() {
        // WHEN
        let device: Device = select_computing_device(true, &DefaultDeviceUtils).unwrap();
        // THEN
        assert!(device.is_cpu());
    }

    #[test]
    fn test_select_computing_device_no_cpu_preference_no_cuda_no_metal() {
        // GIVEN
        let mut mock_device_utils = MockDeviceUtils::new();
        mock_device_utils
            .expect_cuda_is_available()
            .times(1)
            .return_const(false);
        mock_device_utils
            .expect_metal_is_available()
            .times(1)
            .return_const(false);
        // WHEN
        let device: Device = select_computing_device(false, &mock_device_utils).unwrap();
        // THEN
        assert!(device.is_cpu());
    }

    #[test]
    #[ignore = "Requires a 'cuda' feature to be enabled"]
    fn test_select_computing_device_no_cpu_preference_cuda_available() {
        if candle_core::utils::cuda_is_available() {
            // GIVEN
            let mut mock_device_utils = MockDeviceUtils::new();
            mock_device_utils
                .expect_cuda_is_available()
                .times(1)
                .return_const(true);
            mock_device_utils
                .expect_metal_is_available()
                .times(0);
            // WHEN
            let device: Device = select_computing_device(false, &mock_device_utils).unwrap();
            // THEN
            assert!(device.is_cuda());
        } else {
            eprintln!("CUDA is not available on this device. Skipping the test.");
        }
    }

    #[test]
    #[ignore = "Requires a 'metal' feature to be enabled"]
    fn test_select_computing_device_no_cpu_preference_metal_available() {
        if candle_core::utils::metal_is_available() {
            // GIVEN
            let mut mock_device_utils = MockDeviceUtils::new();
            mock_device_utils
                .expect_cuda_is_available()
                .times(1)
                .return_const(false);
            mock_device_utils
                .expect_metal_is_available()
                .times(1)
                .return_const(true);
            // WHEN
            let device: Device = select_computing_device(false, &mock_device_utils).unwrap();
            // THEN
            assert!(device.is_metal());
        } else {
            eprintln!("Metal is not available on this device. Skipping the test.");
        }
    }
}
