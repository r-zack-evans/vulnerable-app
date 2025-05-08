#!/bin/bash

# Replace EJS rendering with JSON responses
sed -i.bak 's/res\.json(\([^)]*\));/res.json(\1);/g' src/routes/product.routes.ts
sed -i.bak 's/res\.json(\'[^'\']*\', { \([^}]*\) })/res.json({ \1 })/g' src/routes/product.routes.ts
sed -i.bak 's/res\.json(\