// this is an Arduino sketch
// the ink shield library can be downloaded from https://github.com/NicholasCLewis/InkShield

#include <Servo.h>
#include <InkShield.h>

#define TIMEOUT     5000
#define PIN_MOTOR   11
#define PIN_PATTERN 2
#define PIN_ROT     4 // analog

#define RATE 512 // higher number is less ink
#define HISTORY_LEN 64

uint8_t history[HISTORY_LEN];

long sprayStartTime = 0;
bool spraying = false;
uint16_t bitmap = 0;

int lastWidth = 0;

Servo rotationServo;

// initialize shield on pin 2
InkShieldA0A3 MyInkShield(2);

void setup() {
    Serial.begin(115200);
    pinMode(PIN_MOTOR, OUTPUT);
    rotationServo.attach(PIN_MOTOR);
    Serial.println("Effector Inkjet 2.0.0");
}

void spray(uint16_t bmp) {
    bitmap = bmp;
    MyInkShield.spray_ink(bitmap);
    spraying = true;
    sprayStartTime = millis();
}

void stopSpraying() {
    MyInkShield.spray_ink(0x0);
    spraying = false;
}

void rememberValue(uint8_t v) {
    // make space for new value
    for (int i = HISTORY_LEN-1; i--; i > 0) {
        history[i] = history[i - 1];
    }

    history[0] = v;
}

uint8_t averageHistory() {
    unsigned int total = 0;

    for (int i = 0; i < HISTORY_LEN; i++) {
        total += history[i];
    }

    return total / HISTORY_LEN;
}

void loop() {
    static long time = 0;

    time++;

    // for safety
    /*if (spraying && (millis() - sprayStartTime) > TIMEOUT) {
        stopSpraying();
    }*/

    // splat ink!
    if (spraying) {
        if (time % RATE == 0) {
            MyInkShield.spray_ink(bitmap);
        }
    }

    // rotation control

    int rawRotationReading = analogRead(PIN_ROT); // shift 10 bit result into 7 bits
    int instantRotation = (float)rawRotationReading * (180.0f / 1024.0f);
    rememberValue(instantRotation);
    int rotation = averageHistory();

    static long lastRot = 0;
    if (lastRot != rotation) {
        rotationServo.write(rotation);
        lastRot = rotation;
    }

    // spray control

    if (digitalRead(PIN_PATTERN)) {
        if (!spraying) {
            spray(0xfff);
        }
    } else {
        if (spraying) {
            stopSpraying();
        }
    }
}
