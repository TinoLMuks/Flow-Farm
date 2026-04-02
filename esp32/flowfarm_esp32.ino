/**
 * FlowFarm ESP32 Aquaponics Monitoring
 * 
 * This sketch reads sensor data and sends it to your FlowFarm backend server
 * via HTTP POST requests for real-time dashboard updates.
 * 
 * Sensors:
 * - DS18B20 Temperature sensor (1-Wire)
 * - pH sensor (analog)
 * - TDS sensor (analog)
 * - Water level sensor (analog)
 * 
 * Required Libraries:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - OneWire
 * - DallasTemperature
 * - ArduinoJson
 * 
 * Install libraries via Arduino IDE: Sketch > Include Library > Manage Libraries
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ══════════════════════════════════════════════════════════════
//  CONFIGURATION - UPDATE THESE VALUES
// ══════════════════════════════════════════════════════════════

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // Your WiFi network name
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";    // Your WiFi password

// Server Configuration
// For local server (Raspberry Pi on same network):
const char* SERVER_URL = "http://192.168.1.100:5000/api/esp32/data";
// For remote server, use your server's public IP or domain:
// const char* SERVER_URL = "http://your-server.com:5000/api/esp32/data";

// Device Configuration
const char* DEVICE_ID = "ESP32-001";  // Unique identifier for this ESP32
const int TANK_ID = 1;                 // Tank ID in your database

// Send interval (milliseconds)
const unsigned long SEND_INTERVAL = 5000;  // 5 seconds

// ══════════════════════════════════════════════════════════════
//  PIN DEFINITIONS
// ══════════════════════════════════════════════════════════════

#define PIN_DS18B20    4    // Temperature sensor - 1-Wire data pin
#define PIN_PH         32   // pH sensor - analog input
#define PIN_TDS        34   // TDS sensor - analog input
#define PIN_LEVEL      33   // Water level sensor - analog input

// ══════════════════════════════════════════════════════════════
//  CALIBRATION VALUES - Adjust based on your sensors
// ══════════════════════════════════════════════════════════════

// pH Calibration
// Measure voltage with pH 7 buffer and pH 4 buffer, update these:
const float PH_VOLTAGE_AT_7 = 2.20;  // Voltage reading in pH 7 buffer
const float PH_VOLTAGE_AT_4 = 3.00;  // Voltage reading in pH 4 buffer

// TDS Calibration
const float TDS_FACTOR = 0.5;  // Adjust based on your TDS probe

// Water Level Calibration
// Run calibration sketch to get these values:
const int LEVEL_RAW_MIN = 640;   // ADC reading when sensor is dry
const int LEVEL_RAW_MAX = 3200;  // ADC reading when fully submerged

// ══════════════════════════════════════════════════════════════
//  GLOBAL OBJECTS AND VARIABLES
// ══════════════════════════════════════════════════════════════

// Temperature sensor
OneWire oneWire(PIN_DS18B20);
DallasTemperature tempSensor(&oneWire);

// Timing
unsigned long lastSendTime = 0;

// Current readings
float temperature = 0.0;
float phValue = 0.0;
float tdsValue = 0.0;
float waterLevel = 0.0;

// Connection status
bool wifiConnected = false;
int failedSends = 0;
const int MAX_FAILED_SENDS = 10;  // Reconnect WiFi after this many failures

// ══════════════════════════════════════════════════════════════
//  SENSOR READING FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Read temperature from DS18B20 sensor
 */
float readTemperature() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  
  if (t == DEVICE_DISCONNECTED_C || t < -50 || t > 100) {
    Serial.println("[TEMP] ERROR: Invalid reading or sensor disconnected");
    return -999.0;
  }
  
  Serial.print("[TEMP] ");
  Serial.print(t, 2);
  Serial.println(" C");
  return t;
}

/**
 * Read pH from analog sensor with averaging
 */
float readPH() {
  long sum = 0;
  for (int i = 0; i < 30; i++) {
    sum += analogRead(PIN_PH);
    delay(10);
  }
  
  float avg = sum / 30.0;
  float voltage = avg * (3.3 / 4095.0);
  
  // Calculate pH from voltage using two-point calibration
  float slope = 3.0 / (PH_VOLTAGE_AT_4 - PH_VOLTAGE_AT_7);
  float ph = 7.0 + (PH_VOLTAGE_AT_7 - voltage) * slope;
  
  // Constrain to valid pH range
  ph = constrain(ph, 0.0, 14.0);
  
  Serial.print("[pH]  voltage=");
  Serial.print(voltage, 3);
  Serial.print("V  pH=");
  Serial.println(ph, 2);
  
  return ph;
}

/**
 * Read TDS with temperature compensation
 */
float readTDS(float currentTemp) {
  long sum = 0;
  for (int i = 0; i < 30; i++) {
    sum += analogRead(PIN_TDS);
    delay(10);
  }
  
  float avg = sum / 30.0;
  float voltage = avg * (3.3 / 4095.0);
  
  // Temperature compensation
  float tempCoeff = 1.0 + 0.02 * (currentTemp - 25.0);
  float compVoltage = voltage / tempCoeff;
  
  // TDS calculation formula
  float tds = (133.42 * compVoltage * compVoltage * compVoltage
             - 255.86 * compVoltage * compVoltage
             + 857.39 * compVoltage) * TDS_FACTOR;
  
  tds = max(tds, 0.0f);
  
  Serial.print("[TDS] voltage=");
  Serial.print(voltage, 3);
  Serial.print("V  TDS=");
  Serial.print(tds, 0);
  Serial.println(" ppm");
  
  return tds;
}

/**
 * Read water level percentage
 */
float readWaterLevel() {
  long sum = 0;
  for (int i = 0; i < 20; i++) {
    sum += analogRead(PIN_LEVEL);
    delay(5);
  }
  
  float raw = sum / 20.0;
  float percent = (float)(raw - LEVEL_RAW_MIN) /
                  (float)(LEVEL_RAW_MAX - LEVEL_RAW_MIN) * 100.0;
  
  percent = constrain(percent, 0.0, 100.0);
  
  Serial.print("[LVL] raw=");
  Serial.print(raw, 0);
  Serial.print("  level=");
  Serial.print(percent, 1);
  Serial.println("%");
  
  return percent;
}

// ══════════════════════════════════════════════════════════════
//  NETWORK FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Connect to WiFi network
 */
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    failedSends = 0;
    Serial.println();
    Serial.print("WiFi connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("WiFi connection FAILED");
  }
}

/**
 * Send sensor data to server via HTTP POST
 */
bool sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected, skipping send");
    return false;
  }
  
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);  // 10 second timeout
  
  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["tank_id"] = TANK_ID;
  
  JsonObject readings = doc.createNestedObject("readings");
  
  // Only include valid readings
  if (temperature != -999.0) {
    readings["temperature"] = round(temperature * 10) / 10.0;  // 1 decimal place
  }
  readings["ph"] = round(phValue * 100) / 100.0;  // 2 decimal places
  readings["tds"] = round(tdsValue);               // Whole number
  readings["water_level"] = round(waterLevel * 10) / 10.0;  // 1 decimal place
  
  // Serialize to string
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("[HTTP] Sending data to server...");
  Serial.println(jsonPayload);
  
  // Send POST request
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP] Response code: ");
    Serial.println(httpCode);
    Serial.print("[HTTP] Response: ");
    Serial.println(response);
    
    http.end();
    
    if (httpCode == 200 || httpCode == 201) {
      failedSends = 0;
      return true;
    }
  } else {
    Serial.print("[HTTP] Error: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
  failedSends++;
  
  // Reconnect WiFi if too many failures
  if (failedSends >= MAX_FAILED_SENDS) {
    Serial.println("[HTTP] Too many failures, reconnecting WiFi...");
    WiFi.disconnect();
    delay(1000);
    connectWiFi();
  }
  
  return false;
}

/**
 * Check server connectivity
 */
bool checkServerConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  HTTPClient http;
  // Remove "/data" and add "/status" for health check
  String statusUrl = String(SERVER_URL);
  statusUrl.replace("/data", "/status");
  
  http.begin(statusUrl);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  http.end();
  
  return (httpCode == 200);
}

// ══════════════════════════════════════════════════════════════
//  MAIN FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Read all sensors and send data
 */
void readAndSendData() {
  Serial.println("\n========== READING SENSORS ==========");
  
  // Read all sensors
  temperature = readTemperature();
  phValue = readPH();
  tdsValue = readTDS(temperature != -999.0 ? temperature : 25.0);
  waterLevel = readWaterLevel();
  
  // Print summary
  Serial.println("---------- SUMMARY ----------");
  Serial.print("Temperature: ");
  Serial.print(temperature != -999.0 ? String(temperature, 1) + " C" : "ERROR");
  Serial.print(" | pH: ");
  Serial.print(phValue, 2);
  Serial.print(" | TDS: ");
  Serial.print(tdsValue, 0);
  Serial.print(" ppm | Level: ");
  Serial.print(waterLevel, 1);
  Serial.println("%");
  
  // Send to server
  if (sendDataToServer()) {
    Serial.println("[OK] Data sent successfully!");
  } else {
    Serial.println("[FAIL] Failed to send data");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n\n");
  Serial.println("╔═══════════════════════════════════════════╗");
  Serial.println("║     FLOWFARM AQUAPONICS MONITOR           ║");
  Serial.println("║     ESP32 -> HTTP -> Dashboard            ║");
  Serial.println("╚═══════════════════════════════════════════╝");
  Serial.println();
  
  // Initialize temperature sensor FIRST (before any ADC setup)
  tempSensor.begin();
  Serial.print("DS18B20 sensors found: ");
  Serial.println(tempSensor.getDeviceCount());
  
  // Configure ADC
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_PH, ADC_11db);
  analogSetPinAttenuation(PIN_TDS, ADC_11db);
  analogSetPinAttenuation(PIN_LEVEL, ADC_11db);
  
  // Connect to WiFi
  connectWiFi();
  
  // Check server connection
  if (wifiConnected) {
    Serial.print("Checking server connection... ");
    if (checkServerConnection()) {
      Serial.println("OK!");
    } else {
      Serial.println("Server not reachable (will retry)");
    }
  }
  
  Serial.println();
  Serial.println("╔═══════════════════════════════════════════╗");
  Serial.println("║     SETUP COMPLETE - MONITORING STARTED   ║");
  Serial.println("╚═══════════════════════════════════════════╝");
  Serial.println();
  
  // Do first reading immediately
  readAndSendData();
}

void loop() {
  // Non-blocking timing
  unsigned long currentTime = millis();
  
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentTime;
    readAndSendData();
  }
  
  // Check WiFi connection periodically
  if (WiFi.status() != WL_CONNECTED && wifiConnected) {
    Serial.println("[WiFi] Connection lost, reconnecting...");
    wifiConnected = false;
    connectWiFi();
  }
  
  // Small delay to prevent tight loop
  delay(10);
}
