# Glass Fax

Send and receive faxes using Google Glass. Seriously.

##Prerequisites

* Google Glass w/ access to Mirror API
* Node.js, NPM and ImageMagick
* [Phaxio](http://www.phaxio.com/)

## Installation

`npm install` or `npm install express phaxio request imagemagick googleapis jade`

## Configuration

* Create a new [Google APIs Project](https://code.google.com/apis/console)
* Enable the Google Mirror API
* Create an OAuth 2.0 client ID for a web application
* Enter your server's hostname and port in [app.js](https://github.com/chadsmith/glassfax/blob/master/app.js#L10-13)
* Enter your Mirror API credentials in [app.js](https://github.com/chadsmith/glassfax/blob/master/app.js#L14-17)
* Enter your [Phaxio API](https://www.phaxio.com/apiSettings) credentials, Phaxio number and a default to number in [app.js](https://github.com/chadsmith/glassfax/blob/master/app.js#L18-23)
* Change your Phaxio number's callback address to http://hostname:port/fax_received

## Usage

`node app` or `forever start app.js`

* Authorize the app by visiting http://hostname:port/ on your computer
* Send faxes by sharing a photo with Glass Fax, speak a phone number in the caption to override the default number
* View faxes you receive in your Glass timeline
* Change the default number to send a fax to by visiting http://hostname:port/number/{digits} on your computer