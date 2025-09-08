# 🆔 How to Get Your Extension ID

## Step-by-Step Instructions

### 1. **Install Your Extension Locally**

1. **Build the extension** (if not already done):
   ```bash
   npm run build
   ```

2. **Open Chrome** and go to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load Your Extension**:
   - Click "Load unpacked"
   - Select the `dist/` folder in your project
   - Click "Select Folder"

### 2. **Copy the Extension ID**

After loading, you'll see your extension card with:
- ✅ **Name**: "Smarty - AI Browser Automation Assistant"
- ✅ **Version**: "1.0.0"
- ✅ **ID**: `abcdefghijklmnopqrstuvwxyz123456` ← **This is what you need!**

**The Extension ID looks like this:**
![Extension ID Example]
```
ID: abcdefghijklmnopqrstuvwxyz123456
```

### 3. **Update the Update Manifest**

1. **Copy the Extension ID** from Chrome
2. **Edit** `smarty-vercel-deploy/public/update.xml`
3. **Replace** `EXTENSION_ID_WILL_BE_GENERATED` with your actual ID:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="YOUR_ACTUAL_EXTENSION_ID_HERE">
    <updatecheck 
      codebase="https://mysmarty.vercel.app/smarty-extension-v1.0.0.crx" 
      version="1.0.0" />
  </app>
</gupdate>
```

### 4. **Push Updates**

```bash
cd smarty-vercel-deploy
git add public/update.xml
git commit -m "Add real extension ID to update manifest"
git push
```

Vercel will automatically redeploy with the updated Extension ID.

## 🔍 **What Happens Next?**

1. **Chrome checks** `https://mysmarty.vercel.app/update.xml` every few hours
2. **Finds your Extension ID** in the manifest
3. **Compares versions** - if newer version available, downloads it
4. **Auto-updates** your extension in the background
5. **User gets notified** that the extension was updated

## 🚨 **Important Notes**

- **Extension ID is permanent** - it never changes for your extension
- **Each installation** gets the same ID (if from same source files)
- **Different browsers** (Chrome vs Edge) may generate different IDs
- **Keep the ID safe** - you'll need it for all future updates

## ✅ **What You Don't Need**

- ❌ No environment variables in Vercel
- ❌ No API keys or secrets
- ❌ No database setup
- ❌ No server-side code

Everything is static files that work immediately! 🎉

## 🧪 **Test Auto-Updates**

After setting the Extension ID:

1. **Install** extension from Chrome (locally)
2. **Change version** to "1.0.1" in manifest.json
3. **Run** `npm run deploy:prepare`
4. **Wait 1-2 hours** - Chrome will auto-update your extension
5. **Check** chrome://extensions/ - version should show "1.0.1"

**That's it! Your auto-update system is complete!** ✅
