#include <InkShield.h>

const int PIN_TRIGGER = 7;

// Initialize shield on pin 2
InkShieldA0A3 MyInkShield(2);

void setup() {
  pinMode(PIN_TRIGGER, INPUT);
}

void loop() {
  if (digitalRead(PIN_TRIGGER)) {
    MyInkShield.spray_ink(0x0FFF);
  }
}

