import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import {Device, State} from 'react-native-ble-plx';
import {Header, ListItem, ThemeProvider} from 'react-native-elements';
import scanner from './scanner';

declare var global: {HermesInternal: null | {}};

const DEVICE_LIST_LIMIT = 50;

const App = () => {
  const [bleState, setBleState] = useState(State.Unknown);
  const [error, setError] = useState<any>('-');
  const [started, setStarted] = useState<boolean>(false);
  const [devices, setDevices] = useState<Device[]>([]);

  const {start, stop, observe} = useMemo(() => scanner(), []);

  useEffect(() => {
    // register observer functions
    observe({
      onStarted: (startedState) => {
        console.log('startedState:', startedState);
        setStarted(startedState);
      },
      onStateChanged: (changedBleState) => {
        console.log('changedBleState', changedBleState);
        setBleState(changedBleState);
      },
      onDeviceDetected: (device: Device) => {
        console.log('device:', device.id, device.name, device.rssi);
        // insert at front, remove last items if list is too long
        setDevices([device].concat(devices.slice(0, DEVICE_LIST_LIMIT)));
      },
      onError: (err) => {
        console.log('error', err);
        setError(err.toString());
      },
    });
  }, [observe, setStarted, setBleState, setDevices, devices, setError]);

  useEffect(() => setError(''), [started]);

  const toggleStarted = useCallback(() => {
    console.log('toggleStarted');
    if (started) {
      stop();
    } else {
      start();
    }
  }, [started, start, stop]);

  return (
    <ThemeProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{text: 'BLE Scanner', style: {color: '#fff'}}}
          leftComponent={
            <Switch
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={started ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleStarted}
              value={started}
            />
          }
        />
        <View style={styles.statusPanel}>
          <ListItem title={'BLE Status'} subtitle={bleState} bottomDivider />
          <ListItem title={'Last Error'} subtitle={error} bottomDivider />
        </View>
        <View style={styles.list}>
          <FlatList
            style={styles.list}
            data={devices}
            renderItem={({item, index}) => (
              <ListItem
                key={index}
                title={item.name || ''}
                subtitle={`RSSI: ${item.rssi}`}
                bottomDivider
              />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
        </View>
      </SafeAreaView>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusPanel: {
    flex: 0,
    marginBottom: 15,
  },
  list: {
    flex: 1,
  },
});

export default App;
