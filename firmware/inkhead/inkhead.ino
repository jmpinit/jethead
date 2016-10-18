// this is an Arduino sketch
// the ink shield library can be downloaded from https://github.com/NicholasCLewis/InkShield

#include <Servo.h>
#include <InkShield.h>

#define DEBUG
#define TIMEOUT 5000
#define PIN_MOTOR 11

long sprayStartTime = 0;
bool spraying = false;

Servo rotationServo;

// initialize shield on pin 2
InkShieldA0A3 MyInkShield(2);

void setup() {
    Serial.begin(115200);
    pinMode(PIN_MOTOR, OUTPUT);
    rotationServo.attach(PIN_MOTOR);
    Serial.println("Effector Inkjet 0.1.0");
}

void spray(uint16_t v) {
    MyInkShield.spray_ink(v);
    spraying = true;
    sprayStartTime = millis();
}

void stopSpraying() {
    MyInkShield.spray_ink(0x0);
    spraying = false;
}

void loop() {
    static int stage = 0;
    static uint8_t command = 0;
    static uint8_t parameter = 0;

    // for safety
    if (spraying && (millis() - sprayStartTime) > TIMEOUT) {
        stopSpraying();
    }

    while (Serial.available()) {
        char c = Serial.read();

        // tick the command parsing state machine

        if (c == '\r') {
            if (stage != 2) {
                // we only want to get here after
                // getting a parameter value and command
                #ifdef DEBUG
                Serial.print("missing parameter and command or just parameter");
                #endif
                Serial.println('!'); // indicate error
            } else {
                switch (command) {
                    case 'S': // spray
                    case 's':
                        spray(parameter);
                        Serial.println("ok");
                        break;
                    case 'R': // rotate
                    case 'r':
                        rotationServo.write(parameter << 2);
                        Serial.println("ok");
                        break;
                    default:
                        // unrecognized command
                        #ifdef DEBUG
                        Serial.print("unrecognized command");
                        #endif
                        Serial.println('!'); // indicate error
                }
            }

            stage = 0;
        } else {
            if (stage == 0) {
                parameter = c;
                stage = 1;
            } else if (stage == 1) {
                command = c;
                stage = 2;
            } else {
                // we expected '\r' instead of ending up here
                #ifdef DEBUG
                Serial.print("expected a carriage return");
                #endif
                Serial.println('!'); // indicate error
                stage = 0; // reset
            }
        }
    }
}
