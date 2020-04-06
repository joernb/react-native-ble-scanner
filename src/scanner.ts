import {BleManager, State, Device, Subscription} from 'react-native-ble-plx';

export interface Observer {
  onStarted: (started: boolean) => void;
  onStateChanged: (state: State) => void;
  onDeviceDetected: (device: Device) => void;
  onError: (error: any) => void;
}

/**
 * Sets up BLE scanning and returns functions for controlling it externally.
 */
export default () => {
  const bleManager = new BleManager();
  // also acts as 'started' flag
  let subscription: Subscription | null = null;
  // stores external observer callbacks
  let observer: Observer = {
    onStarted: () => {},
    onStateChanged: () => {},
    onDeviceDetected: () => {},
    onError: () => {},
  };

  const observe = (newObserver: Observer) => (observer = newObserver);

  const start = () => {
    if (subscription) {
      try {
        subscription.remove();
      } catch (error) {
        observer.onError(error);
      }
    }
    try {
      // listen to ble manager state changes (e.g. PowerOff, PowerOn, ...)
      subscription = bleManager.onStateChange((state) => {
        observer.onStateChanged(state);

        if (state === State.PoweredOn) {
          try {
            // Start scan, will stop previous scans
            bleManager.startDeviceScan(null, null, (error, device) => {
              if (error) {
                observer.onError(error);
                return;
              }

              if (device) {
                observer.onDeviceDetected(device);
              }
            });
          } catch (error) {
            observer.onError(error);
          }
        }
      }, true);
      observer.onStarted(true);
    } catch (error) {
      observer.onError(error);
      stop();
    }
  };

  const stop = () => {
    if (subscription) {
      try {
        subscription.remove();
        bleManager.stopDeviceScan();
      } catch (error) {
        observer.onError(error);
      }
      subscription = null;
      observer.onStarted(false);
    }
  };

  return {
    start,
    stop,
    observe,
  };
};
