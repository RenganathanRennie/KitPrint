package com.kitprint

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*

class UsbPrinterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val TAG = "UsbPrinterModule"
  private var connection: UsbDeviceConnection? = null
  private var outEndpoint: UsbEndpoint? = null
  private var device: UsbDevice? = null
  private var permissionPromise: Promise? = null

  companion object {
    const val ACTION_USB_PERMISSION = "com.kitprint.USB_PERMISSION"
  }

  override fun getName(): String {
    return "UsbPrinter"
  }

  @ReactMethod
  fun getDeviceList(promise: Promise) {
    try {
      val usbManager = reactContext.getSystemService(Context.USB_SERVICE) as UsbManager
      val list = Arguments.createArray()
      for ((_, dev) in usbManager.deviceList) {
        val map = Arguments.createMap()
        map.putInt("vendorId", dev.vendorId)
        map.putInt("productId", dev.productId)
        map.putString("deviceName", dev.deviceName)
        map.putInt("deviceId", dev.deviceId)
        list.pushMap(map)
      }
      promise.resolve(list)
    } catch (e: Exception) {
      promise.reject("USB_LIST_ERROR", e)
    }
  }

  @ReactMethod
  fun requestPermission(vendorId: Int, productId: Int, promise: Promise) {
    try {
      val usbManager = reactContext.getSystemService(Context.USB_SERVICE) as UsbManager
      var target: UsbDevice? = null
      for ((_, dev) in usbManager.deviceList) {
        if (dev.vendorId == vendorId && dev.productId == productId) {
          target = dev
          break
        }
      }
      if (target == null) {
        promise.reject("USB_NOT_FOUND", "Device not found")
        return
      }
      val pi = PendingIntent.getBroadcast(reactContext, 0, Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE)
      val filter = IntentFilter(ACTION_USB_PERMISSION)
      reactContext.registerReceiver(object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          try {
            reactContext.unregisterReceiver(this)
          } catch (ex: Exception) {
            // ignore
          }
          val granted = intent?.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false) ?: false
          if (granted) {
            promise.resolve(true)
          } else {
            promise.reject("USB_PERMISSION_DENIED", "Permission denied")
          }
        }
      }, filter)
      usbManager.requestPermission(target, pi)
    } catch (e: Exception) {
      promise.reject("USB_PERMISSION_ERROR", e)
    }
  }

  @ReactMethod
  fun connectPrinter(vendorId: Int, productId: Int, promise: Promise) {
    try {
      val usbManager = reactContext.getSystemService(Context.USB_SERVICE) as UsbManager
      var target: UsbDevice? = null
      for ((_, dev) in usbManager.deviceList) {
        if (dev.vendorId == vendorId && dev.productId == productId) {
          target = dev
          break
        }
      }
      if (target == null) {
        promise.reject("USB_NOT_FOUND", "Device not found")
        return
      }

      val hasPermission = usbManager.hasPermission(target)
      if (!hasPermission) {
        promise.reject("USB_NO_PERMISSION", "No permission for device")
        return
      }

      val conn = usbManager.openDevice(target)
      if (conn == null) {
        promise.reject("USB_OPEN_FAILED", "Failed to open device")
        return
      }

      // find first OUT endpoint
      var foundOut: UsbEndpoint? = null
      var claimInterface: UsbInterface? = null
      for (i in 0 until target.interfaceCount) {
        val intf = target.getInterface(i)
        for (j in 0 until intf.endpointCount) {
          val ep = intf.getEndpoint(j)
          if (ep.direction == UsbConstants.USB_DIR_OUT) {
            foundOut = ep
            claimInterface = intf
            break
          }
        }
        if (foundOut != null) break
      }

      if (foundOut == null || claimInterface == null) {
        conn.close()
        promise.reject("USB_ENDPOINT_NOT_FOUND", "No OUT endpoint found")
        return
      }

      val claimed = conn.claimInterface(claimInterface, true)
      if (!claimed) {
        conn.close()
        promise.reject("USB_CLAIM_FAILED", "Failed to claim interface")
        return
      }

      connection = conn
      outEndpoint = foundOut
      device = target
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("USB_CONNECT_ERROR", e)
    }
  }

  @ReactMethod
  fun printRaw(base64Text: String, promise: Promise) {
    try {
      val conn = connection
      val ep = outEndpoint
      if (conn == null || ep == null) {
        promise.reject("USB_NOT_CONNECTED", "Printer not connected")
        return
      }

      val bytes = android.util.Base64.decode(base64Text, android.util.Base64.DEFAULT)
      var offset = 0
      val chunkSize = 1024
      while (offset < bytes.size) {
        val len = Math.min(chunkSize, bytes.size - offset)
        val sent = conn.bulkTransfer(ep, bytes, offset, len, 5000)
        if (sent <= 0) {
          promise.reject("USB_WRITE_FAILED", "Failed to write to device")
          return
        }
        offset += sent
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("USB_PRINT_ERROR", e)
    }
  }

  @ReactMethod
  fun disconnect(promise: Promise) {
    try {
      connection?.close()
      connection = null
      outEndpoint = null
      device = null
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("USB_DISCONNECT_ERROR", e)
    }
  }
}
