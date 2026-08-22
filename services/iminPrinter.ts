import { NativeModules } from 'react-native';

const { IminPrinter } = NativeModules as { IminPrinter?: any };

export async function initPrinter(): Promise<boolean> {
  if (!IminPrinter || !IminPrinter.initPrinter) return false;
  return await IminPrinter.initPrinter();
}

export async function getPrinterStatus(): Promise<number | null> {
  if (!IminPrinter || !IminPrinter.getPrinterStatus) return null;
  return await IminPrinter.getPrinterStatus();
}

export async function printText(text: string): Promise<boolean> {
  if (!IminPrinter || !IminPrinter.printText) return false;
  return await IminPrinter.printText(text);
}

export async function enterPrinterBuffer(clean = true): Promise<boolean> {
  if (!IminPrinter || !IminPrinter.enterPrinterBuffer) return false;
  return await IminPrinter.enterPrinterBuffer(clean);
}

export async function commitPrinterBuffer(): Promise<number | null> {
  if (!IminPrinter || !IminPrinter.commitPrinterBuffer) return null;
  return await IminPrinter.commitPrinterBuffer();
}

export default {
  initPrinter,
  getPrinterStatus,
  printText,
  enterPrinterBuffer,
  commitPrinterBuffer,
};
