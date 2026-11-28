Chalo, latest `rtiweb.zip` upload aur deploy karte hain. Existing live website ka backup bhi lenge.

### **Server pe file Transfer karo**

Ye command run karo:

```
scp "C:\prjs\Rti-apk\rtiweb.zip" root@189.72.144.238:/var/backups/
```


### **Step 1 — Server connect karo**

Upload complete hone ke baad VPS SSH terminal login karo :

```
 ssh root@189.72.144.238
```

### **Step 2 — ZIP extract karo**

```
mkdir -p /var/www/rtiweb-latest
unzip -o /var/backups/rtiweb.zip -d /var/www/rtiweb-latest
```

### **Step 3 — Extracted files check karo**

```
ls -lah /var/www/rtiweb-latest
find /var/www/rtiweb-latest -maxdepth 3 -name index.html
```

**Abhi live website par copy mat karna.** Pehle output bhejo. ZIP ke andar `dist` folder hai ya direct website files, uske hisaab se exact deployment command dunga. Existing PHP API proxy files ko safe rakhenge.

Chalo, ab deployment ke liye ye commands **VPS SSH terminal** mein ek saath run karo.

### **Step 4 — ZIP structure + backup check**

```
echo "===== ZIP CONTENTS ====="
ls -lah /var/www/rtiweb-latest

echo "===== INDEX FILES ====="
find /var/www/rtiweb-latest -maxdepth 4 -type f -name "index.html"

echo "===== LIVE BACKUP ====="
BACKUP="/var/backups/rtiweb-before-latest-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C /var/www rtiweb
ls -lh "$BACKUP"
```

### **Step 5 — Output bhejo**

Mujhe `index.html` ka path aur backup ka output bhejo.

Uske baad main exact `rsync` command dunga jo latest website live karega, bina existing API proxy files ko overwrite kiye.

Backup successfully ban gaya hai — **110 MB**. 👍

Ek important observation: tumhare `rtiweb.zip` mein Expo source code hai, ready `index.html` build nahi hai. Isliye pehle build generate karna hoga.

### **Step 1 — Build scripts check karo**

VPS SSH terminal mein:

```
cd /var/www/rtiweb-latest

node -e "console.log(JSON.stringify(require('./package.json').scripts,null,2))"
```

### **Step 2 — Dependencies check karo**

```
test -d node_modules && echo "NODE_MODULES EXISTS" || echo "NODE_MODULES MISSING"

node -v
npm -v
```

In commands ka output bhejo.

Uske baad Expo web build generate karenge, phir `dist` ko live `/var/www/rtiweb/` mein deploy karenge. Existing API proxy aur PHP helper files preserve rahengi.

Perfect! Build configuration mil gaya. Tumhare project mein:

- Build command: `npm run build`
- Expo web export ke baad `fix-web-base-path.js` automatically execute hoga.
- Node.js `v22.22.1` available hai.
- `node_modules` missing hai, isliye dependencies install karni hongi.

Abhi live website par koi change nahi hua hai. Backup safe hai.

### **Step 1 — Dependencies install karo**

**VPS SSH terminal** mein:

```
cd /var/www/rtiweb-latest
npm ci
```

Installation complete hone ka wait karo.

### **Step 2 — Expo web build generate karo**

```
npm run build
```

### **Step 3 — Build verify karo**

```
ls -lah dist/
test -f dist/index.html && echo "BUILD SUCCESS" || echo "BUILD FAILED"
```



Expected

`BUILD SUCCESS`



**Abhi live folder mein copy mat karna.** Build ka output bhejo. Uske baad deployment karenge, existing PHP proxy files preserve karke.

Super! 🎉 Ab latest build ko live website par deploy karte hain.

### **Step 1 — Build verify**

VPS SSH terminal:

```
cd /var/www/rtiweb-latest
test -f dist/index.html && echo "BUILD READY"
```

### **Step 2 — Live deployment**

```
rsync -av --exclude='api-proxy.php' --exclude='news-share.php' \
/var/www/rtiweb-latest/dist/ /var/www/rtiweb/
```

### **Step 3 — Permissions and Nginx**

```
chown -R www-data:www-data /var/www/rtiweb
nginx -t && systemctl reload nginx
```

### **Step 4 — Live website test**

```
curl -k -I https://189.72.144.238/
md5sum /var/www/rtiweb/index.html /var/www/rtiweb-latest/dist/index.html
```

Expected:

- `HTTP 200 OK`
- Dono MD5 hashes same.

Browser mein `Ctrl + Shift + R` karke latest website check karo. API proxy files existing wali hi rahengi.