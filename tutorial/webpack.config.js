const path = require('path');
const fs = require('fs');

module.exports = {
  mode: 'development',
  entry: {
    'central-login': './central-login/index.js',
    'embedded-login': './embedded-login/index.js'
  },
  output: {
    filename: '[name]/bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    library: {
      type: 'window'
    }
  },
  resolve: {
    extensions: ['.js'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    hot: true,
    port: 8443,
    https: {
      key: fs.readFileSync(path.join(__dirname, 'certs/fec.key')),
      cert: fs.readFileSync(path.join(__dirname, 'certs/fec.crt')),
    },
    host: 'sdkapp.example.com',
    headers: {
      "Access-Control-Allow-Origin": "https://yourtenant.forgeblocks.com",
      "Access-Control-Allow-Credentials": "true"
    },
    devMiddleware: {
      publicPath: '/dist/'
    }
  }
};
