#!/usr/bin/env node
import mongoose from "mongoose";
import { config } from "./server/src/config.js";

const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
};

const checkProducts = async () => {
  await connectDB();
  
  const Product = mongoose.model("Product", new mongoose.Schema({ name: String, stock: Number }, { timestamps: true }));
  
  const products = await Product.find().lean();
  console.log("📦 Products and Stock Levels:");
  products.forEach(p => {
    console.log(`   ${p.name}: ${p.stock} units`);
  });
  
  await mongoose.disconnect();
};

checkProducts();
