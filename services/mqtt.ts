import 'react-native-url-polyfill/auto';
import mqtt from 'mqtt';

const MQTT_BROKER_URL = 'wss://broker-wss.cloudxiot.app/mqtt';
// IMPORTANT:
// Replace above URL with actual WSS URL from provider

const MQTT_USERNAME = 'cloudkitchen';
const MQTT_PASSWORD = 'Zj4htDlvw1OH0gV2wMSuU5gCPiHVlQVX';

const MQTT_TOPICS = [  
  'cloudkitchen/device/device001/data'
];

let mqttClient: mqtt.MqttClient | null = null;

/**
 * Connect MQTT
 */
export const connectAndSubscribeMQTT = (
  onMessageReceived: (topic: string, data: any) => void,
  onError?: (error: Error) => void
) => {

  try {

    mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `android_${Date.now()}`,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,

      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,

      protocolVersion: 4
    });

    // CONNECTED
    mqttClient.on('connect', () => {

      console.log('✅ MQTT CONNECTED');

      MQTT_TOPICS.forEach((topic) => {

        mqttClient?.subscribe(topic, { qos: 1 }, (err) => {

          if (err) {

            console.log('❌ SUBSCRIBE ERROR');
            console.log(err);

            if (onError) {
              onError(err);
            }

          } else {

            console.log('✅ SUBSCRIBED:', topic);

          }

        });

      });

    });

    // MESSAGE RECEIVED
    mqttClient.on('message', (topic, message) => {

      try {

        const rawMessage = message.toString();

        console.log('');
        console.log('════════════════════');
        console.log('📩 MQTT MESSAGE');
        console.log('TOPIC:', topic);
        console.log('RAW:', rawMessage);

        let parsedData: any;

        try {

          parsedData = JSON.parse(rawMessage);

        } catch {

          parsedData = rawMessage;

        }

        console.log('PARSED:', parsedData);
        console.log('════════════════════');
        console.log('');

        onMessageReceived(topic, parsedData);

      } catch (error) {

        console.log('❌ MESSAGE ERROR');
        console.log(error);

      }

    });

    // ERROR
    mqttClient.on('error', (error) => {

      console.log('❌ MQTT ERROR');
      console.log(error);

      if (onError) {
        onError(error as Error);
      }

    });

    // RECONNECT
    mqttClient.on('reconnect', () => {

      console.log('🔄 MQTT RECONNECTING');

    });

    // OFFLINE
    mqttClient.on('offline', () => {

      console.log('⚠️ MQTT OFFLINE');

    });

    // CLOSED
    mqttClient.on('close', () => {

      console.log('⚠️ MQTT CLOSED');

    });

    return mqttClient;

  } catch (error) {

    console.log('❌ MQTT SETUP ERROR');
    console.log(error);

    return null;

  }

};

/**
 * Publish MQTT Message
 */
export const publishMQTTMessage = (
  topic: string,
  payload: any
) => {

  if (!mqttClient) {
    console.log('❌ MQTT NOT CONNECTED');
    return;
  }

  mqttClient.publish(
    topic,
    JSON.stringify(payload),
    { qos: 1 },
    (err) => {

      if (err) {

        console.log('❌ PUBLISH ERROR');
        console.log(err);

      } else {

        console.log('✅ MESSAGE PUBLISHED');
        console.log('TOPIC:', topic);

      }

    }
  );

};

/**
 * Disconnect MQTT
 */
export const disconnectMQTT = () => {

  if (mqttClient) {

    mqttClient.end();

    mqttClient = null;

    console.log('🔌 MQTT DISCONNECTED');

  }

};