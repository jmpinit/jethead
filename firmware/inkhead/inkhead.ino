// this is an Arduino sketch
// the ink shield library can be downloaded from https://github.com/NicholasCLewis/InkShield

#include <Servo.h>
#include <InkShield.h>

#define DEBUG
#define TIMEOUT 5000
#define PIN_MOTOR 11

#define RATE 512 // higher number is less ink

long sprayStartTime = 0;
bool spraying = false;
int lastRotation = 0;
uint16_t bitmap = 0;

Servo rotationServo;

// initialize shield on pin 2
InkShieldA0A3 MyInkShield(2);

void setup() {
    Serial.begin(115200);
    pinMode(PIN_MOTOR, OUTPUT);
    rotationServo.attach(PIN_MOTOR);
    Serial.println("Effector Inkjet 1.0.0");
    lastRotation = rotationServo.read();
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

void loop() {
    static long time = 0;
    static int stage = 0;
    static uint8_t command = 0;
    static uint16_t parameter = 0;

    time++;

    // for safety
    if (spraying && (millis() - sprayStartTime) > TIMEOUT) {
        stopSpraying();
    }

    // splat ink!
    if (spraying) {
        if (time % RATE == 0) {
            MyInkShield.spray_ink(bitmap);
        }
    }

    while (Serial.available()) {
        uint8_t c = Serial.read();

        // tick the command parsing state machine

        if (c == '\r') {
            if (stage != 3) {
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
                        if (parameter & 0xf000) {
                            #ifdef DEBUG
                            Serial.print("parameter has unsprayable bits set");
                            #endif
                            Serial.println('!');
                        } else {
                            spray(parameter);
                            Serial.println("ok");
                        }
                        break;
                    case 'R': // rotate
                    case 'r':
                        if (parameter > 180) {
                            #ifdef DEBUG
                            Serial.print("parameter out of bounds: ");
                            Serial.print(parameter);
                            #endif
                            Serial.println('!');
                        } else {
                            rotationServo.write(parameter);

                            // wait until we actually get there
                            delay(abs(lastRotation - (int)parameter) * 10);

                            lastRotation = parameter;
                            Serial.println("ok");
                        }
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
                parameter |= c << 8;
                stage = 2;
            } else if (stage == 2) {
                command = c;
                stage = 3;
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
