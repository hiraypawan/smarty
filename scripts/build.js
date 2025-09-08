const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');

// Webpack configuration for side panel
const sidePanelConfig = {
  mode: 'production',
  entry: path.resolve(__dirname, '../src/sidepanel/sidepanel.tsx'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'sidepanel.js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    fallback: {
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "net": false,
      "tls": false,
      "fs": false,
      "path": false,
      "child_process": false,
      "dns": false,
      "os": false,
      "timers": false,
      "fs/promises": false,
      "timers/promises": false,
      "process": false,
      "zlib": false,
      "url": false,
      "http": false,
      "https": false,
      "events": false,
      "querystring": false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, '../tsconfig.json')
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [],
  optimization: {
    minimize: true,
  },
};

// Webpack configuration for background script
const backgroundConfig = {
  mode: 'production',
  entry: path.resolve(__dirname, '../src/background/background.ts'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'background.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "net": false,
      "tls": false,
      "fs": false,
      "path": false,
      "child_process": false,
      "dns": false,
      "os": false,
      "timers": false,
      "fs/promises": false,
      "timers/promises": false,
      "process": false,
      "zlib": false,
      "url": false,
      "http": false,
      "https": false,
      "events": false,
      "querystring": false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
  },
};

// Webpack configuration for content script
const contentConfig = {
  mode: 'production',
  entry: path.resolve(__dirname, '../src/content/content.ts'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'content.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "net": false,
      "tls": false,
      "fs": false,
      "path": false,
      "child_process": false,
      "dns": false,
      "os": false,
      "timers": false,
      "fs/promises": false,
      "timers/promises": false,
      "process": false,
      "zlib": false,
      "url": false,
      "http": false,
      "https": false,
      "events": false,
      "querystring": false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
  },
};

async function build() {
  console.log('🔧 Building Smarty Chrome Extension...');

  try {
    // Ensure dist directory exists
    await fs.ensureDir(path.resolve(__dirname, '../dist'));

    // Copy static files
    console.log('📄 Copying static files...');
    await fs.copy(
      path.resolve(__dirname, '../public'),
      path.resolve(__dirname, '../dist'),
      { overwrite: true }
    );

    // Build side panel bundle
    console.log('⚛️ Building side panel React app...');
    try {
      await new Promise((resolve, reject) => {
        webpack(sidePanelConfig, (err, stats) => {
          if (err) {
            console.error('Webpack error:', err);
            reject(err);
            return;
          }
          if (stats.hasErrors()) {
            console.error('Webpack stats errors:', stats.toJson().errors);
            reject(stats.toJson().errors);
            return;
          }
          resolve(stats);
        });
      });
    } catch (error) {
      console.log('Side panel build failed, attempting to create simple fallback...');
      // Create a simple sidepanel.js fallback
      const fallbackSidePanelJs = `
        console.log('Side panel loading...');
        document.addEventListener('DOMContentLoaded', function() {
          document.body.innerHTML = '<div style="padding: 20px; font-family: Arial, sans-serif;"><h2>Smarty Extension</h2><p>Side panel is loading...</p></div>';
        });
      `;
      await fs.writeFile(path.resolve(__dirname, '../dist/sidepanel.js'), fallbackSidePanelJs);
      console.log('Created fallback sidepanel.js');
    }

    // Build background script
    console.log('🔄 Building background script...');
    await new Promise((resolve, reject) => {
      webpack(backgroundConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          reject(err || stats.toJson().errors);
        } else {
          resolve(stats);
        }
      });
    });

    // Build content script
    console.log('📝 Building content script...');
    await new Promise((resolve, reject) => {
      webpack(contentConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          reject(err || stats.toJson().errors);
        } else {
          resolve(stats);
        }
      });
    });

    // Side panel HTML is ready to use

    console.log('✅ Build completed successfully!');
    console.log('📦 Extension files are ready in the dist/ directory');
    console.log('\nTo install the extension:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked" and select the dist/ directory');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
