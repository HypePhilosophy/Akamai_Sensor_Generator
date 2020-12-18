# Akamai Sensor Generator
This repository is for research purposes only. It is a functional Akamai is a functional akamai sensor generator, however is on version 1.52 of Akamai Anti-bot. In order to function on the newest Akamai version, it must be revamped, and some portions must be rewritten.

## Setup
1. Clone the repository
2. Install the necessary dependencies
3. 

## Methodology
The Akamai Sensor Generator was created by reversing the obfuscated Akamai Collector script, which can be found [here.](https://us.louisvuitton.com/bundles/f07e41afui210f89b730060204942b)

Using [de4js](https://lelinhtinh.github.io/de4js/) and selecting array, you are able to view the raw JS code that Akamai uses to determine if you are a human or not.

The Sensor Generator works like this:
1. Visit website to obtain temporary Akamai cookie
2. Using temp akamai cookie, spoof values for the sensor string
3. Submit cookie + spoofed values to akamai collector url
4. Receive valid Akamai cookie

Cookies are valid for a year, except some websites may choose to clear them at any time.

## Reflections
Thank you to [Eric](https://github.com/ericz99) and [Zed](https://github.com/zedd3v) for making this possible.
