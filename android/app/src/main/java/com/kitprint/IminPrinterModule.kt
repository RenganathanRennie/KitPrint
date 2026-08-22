package com.kitprint

import com.facebook.react.bridge.*
import com.imin.printer.INeoPrinterCallback
import com.imin.printer.PrinterHelper
import java.util.concurrent.atomic.AtomicBoolean

class IminPrinterModule(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {

  private val printer = PrinterHelper.getInstance()
  private val serviceReady = AtomicBoolean(false)
  private var initPromise: Promise? = null

  private val initCallback = object : com.imin.printer.InitPrinterCallback {
    override fun onConnected() {
      serviceReady.set(true)
      initPromise?.resolve(true)
      initPromise = null
    }

    override fun onDisconnected() {
      serviceReady.set(false)
    }
  }

  private fun callback(promise: Promise, onResult: (Boolean) -> Unit) = object : INeoPrinterCallback() {
    override fun onRunResult(isSuccess: Boolean) = Unit
    override fun onReturnString(result: String?) = Unit
    override fun onRaiseException(code: Int, msg: String?) = promise.reject("PRINTER_ERROR", msg)
    override fun onPrintResult(code: Int, msg: String?) {
      promise.resolve(code == 1)
    }
  }

  override fun getName(): String {
    return "IminPrinter"
  }

  @ReactMethod
  fun initPrinter(promise: Promise) {
    try {
      val activity = reactApplicationContext.currentActivity ?: throw Exception("No activity")
      if (serviceReady.get()) {
        promise.resolve(true)
        return
      }
      initPromise = promise
      if (!printer.initPrinterService(activity, initCallback)) {
        initPromise = null
        promise.reject("INIT_ERROR", "Unable to bind the iMin printer service")
      }
    } catch (e: Exception) {
      promise.reject("INIT_ERROR", e)
    }
  }

  @ReactMethod
  fun getPrinterStatus(promise: Promise) {
    try {
      promise.resolve(printer.getPrinterStatus())
    } catch (e: Exception) {
      promise.reject("STATUS_ERROR", e)
    }
  }

  @ReactMethod
  fun printText(text: String, promise: Promise) {
    try {
      printer.printText(text, callback(promise) { success ->
        if (success) promise.resolve(true)
      })
    } catch (e: Exception) {
      promise.reject("PRINT_ERROR", e)
    }
  }

  @ReactMethod
  fun enterPrinterBuffer(clean: Boolean, promise: Promise) {
    try {
      printer.enterPrinterBuffer(clean)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("BUFFER_ERROR", e)
    }
  }

  @ReactMethod
  fun commitPrinterBuffer(promise: Promise) {
    try {
      printer.commitPrinterBuffer(callback(promise) { success ->
        if (success) promise.resolve(48)
      })
    } catch (e: Exception) {
      promise.reject("COMMIT_ERROR", e)
    }
  }
}
