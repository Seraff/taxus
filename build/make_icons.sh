mkdir build/icon.iconset

sips -z 16 16     img/icon.png --out build/icon.iconset/icon_16x16.png
sips -z 32 32     img/icon.png --out build/icon.iconset/icon_16x16@2x.png
sips -z 32 32     img/icon.png --out build/icon.iconset/icon_32x32.png
sips -z 64 64     img/icon.png --out build/icon.iconset/icon_32x32@2x.png
sips -z 128 128   img/icon.png --out build/icon.iconset/icon_128x128.png
sips -z 256 256   img/icon.png --out build/icon.iconset/icon_128x128@2x.png
sips -z 256 256   img/icon.png --out build/icon.iconset/icon_256x256.png
sips -z 512 512   img/icon.png --out build/icon.iconset/icon_256x256@2x.png
sips -z 512 512   img/icon.png --out build/icon.iconset/icon_512x512.png
sips -z 1024 1024   img/icon.png --out build/icon.iconset/icon_512x512@2x.png

iconutil -c icns --output build/icon.icns build/icon.iconset
rm -R build/icon.iconset
