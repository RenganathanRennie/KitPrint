import { NativeModules } from 'react-native';
const { UsbPrinter } = NativeModules as { UsbPrinter?: any };

export async function listUsbDevices(): Promise<Array<any>> {
  if (!UsbPrinter || !UsbPrinter.getDeviceList) return [];
  return await UsbPrinter.getDeviceList();
}

export async function requestPermission(vendorId: number, productId: number): Promise<boolean> {
  if (!UsbPrinter || !UsbPrinter.requestPermission) return false;
  return await UsbPrinter.requestPermission(vendorId, productId);
}

export async function connectPrinter(vendorId: number, productId: number): Promise<boolean> {
  if (!UsbPrinter || !UsbPrinter.connectPrinter) return false;
  return await UsbPrinter.connectPrinter(vendorId, productId);
}

export async function printRaw(base64Bytes: string): Promise<boolean> {
  if (!UsbPrinter || !UsbPrinter.printRaw) return false;
  return await UsbPrinter.printRaw(base64Bytes);
}

export async function disconnect(): Promise<boolean> {
  if (!UsbPrinter || !UsbPrinter.disconnect) return false;
  return await UsbPrinter.disconnect();
}

function utf8ToBytes(str: string): number[] {
  const utf8 = unescape(encodeURIComponent(str || ''));
  const arr: number[] = [];
  for (let i = 0; i < utf8.length; i++) arr.push(utf8.charCodeAt(i));
  return arr;
}

function base64EncodeBytes(bytes: number[]): string {
  const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const chr1 = bytes[i++];
    const chr2 = i < bytes.length ? bytes[i++] : NaN;
    const chr3 = i < bytes.length ? bytes[i++] : NaN;
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;
    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }
    output += keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
  }
  return output;
}

export async function printText(text: string): Promise<boolean> {
  const bytes = utf8ToBytes(text);
  const base64 = base64EncodeBytes(bytes);
  return await printRaw(base64);
}

export async function printEscPos(text: string): Promise<boolean> {
  // Build ESC/POS sequence: init, text, feed, cut
  const init = [0x1b, 0x40]; // ESC @
  const feed = [0x1b, 0x64, 0x05]; // ESC d n (5 lines)
  const cut = [0x1d, 0x56, 0x00]; // GS V 0 (full cut)
  const textBytes = utf8ToBytes(text + '\n\n');
  const all = init.concat(textBytes).concat(feed).concat(cut);
  const base64 = base64EncodeBytes(all);
  return await printRaw(base64);
}

export default { listUsbDevices, requestPermission, connectPrinter, printRaw, disconnect, printText, printEscPos };
