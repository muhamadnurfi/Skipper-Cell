# TODO - Implementasi Fitur Wishlist

## Step 1: Update Prisma Schema

- [x] Tambah model Wishlist dan WishlistItem di schema.prisma
- [x] Tambah relasi opposite di User dan Product

## Step 2: Database Migration

- [x] Jalankan prisma migrate untuk update database

## Step 3: Generate Prisma Client

- [x] Jalankan prisma generate

## Step 4: Validation Schema

- [x] Tambah validasi addToWishlistSchema di validationSchema.js

## Step 5: Wishlist Controller

- [x] Buat wishlist.controller.js dengan fungsi:
  - getWishlist()
  - addToWishlist()
  - removeFromWishlist()
  - clearWishlist()
  - checkWishlistStatus()

## Step 6: Wishlist Route

- [x] Buat wishlist.route.js

## Step 7: Update Server.js

- [x] Import dan gunakan wishlistRouter di server.js

## Step 8: Testing

- [ ] Test API endpoints dengan Postman/Thunder Client
