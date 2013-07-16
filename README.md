# Glass Fax

Send and receive faxes using Google Glass. Seriously.

##Prerequisites

* Google Glass w/ access to Mirror API
* Node.js, NPM and ImageMagick
* [Phaxio](http://www.phaxio.com/)

## Installation

`npm install` or `npm install express phaxio request imagemagick googleapis`

## Configuration

* Create a new [Google APIs Project](https://code.google.com/apis/console)
* Enable the Google Mirror API
* Create an OAuth 2.0 client ID for a web application
* Enter your server's hostname and port in app.js
* Enter your Mirror API credentials in app.js
* Enter your [Phaxio API](https://www.phaxio.com/apiSettings) credentials, Phaxio number and a default to number in app.js
* Change your Phaxio number's callback address to http://hostname:port/fax_received

## Usage

`node app` or `forever start app.js`

* Authorize the app by visiting http://hostname:port/ on your computer
* Send faxes by sharing a photo with Glass Fax
* View faxes you receive in your Glass timeline
* Change the number to send a fax to by visiting http://hostname:port/number/{digits} on your computer

## TODO

* Support for viewing the larger fax will be added once [this](https://code.google.com/p/google-glass-api/issues/detail?id=137) happens