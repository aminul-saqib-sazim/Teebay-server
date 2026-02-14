import type { INestApplication } from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";

import type { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import type { MikroORM } from "@mikro-orm/postgresql";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ProductCategory } from "@/common/entities/product-categories.entity";
import { Product } from "@/common/entities/products.entity";
import { EProductCategory, ERentOption } from "@/common/enums/products.enums";

import { bootstrapTestServer } from "../utils/bootstrap";
import { truncateTables } from "../utils/db";
import { getBearerToken } from "../utils/helpers/bearer-token.helpers";
import { createUserInDb } from "../utils/helpers/create-user-in-db.helpers";

describe("Products E2E", () => {
  let app: INestApplication;
  let httpServer: ReturnType<INestApplication["getHttpServer"]>;
  let dbService: EntityManager<IDatabaseDriver<Connection>>;
  let orm: MikroORM;

  const validProductData = {
    title: "Test Product",
    description: "Test Description",
    price: 100,
    rentalPrice: 20,
    rentOption: ERentOption.DAILY,
    quantity: 10,
    categories: [EProductCategory.ELECTRONICS],
  };

  beforeAll(async () => {
    const { appInstance, httpServerInstance, dbServiceInstance, ormInstance } =
      await bootstrapTestServer();
    app = appInstance;
    httpServer = httpServerInstance;
    dbService = dbServiceInstance;
    orm = ormInstance;
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  beforeEach(async () => {
    await truncateTables(dbService);
    dbService.clear();
  });

  describe("POST /products (create product)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).post("/products").send(validProductData);

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe("Invalid or expired session");
    });

    it("should create product when authenticated", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/products")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send(validProductData);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.data).toMatchObject({
        title: validProductData.title,
        description: validProductData.description,
        price: validProductData.price,
        rentalPrice: validProductData.rentalPrice,
        quantity: validProductData.quantity,
      });
    });

    it("should return 400 when required fields are missing", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/products")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ title: "Test" });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it("should validate categories enum", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/products")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          ...validProductData,
          categories: ["INVALID_CATEGORY"],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe("GET /products (list products)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).get("/products");

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return empty list when no products exist", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .get("/products")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.meta.total).toBe(0);
    });

    it("should return paginated products", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .get("/products")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.meta.total).toBe(1);
    });

    it("should filter products by category", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product1 = dbService.create(Product, {
        title: "Electronics Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      const product2 = dbService.create(Product, {
        title: "Furniture Product",
        description: "Test Description",
        price: 200,
        rentalPrice: 40,
        quantity: 5,
        categories: [EProductCategory.FURNITURE],
        owner: user,
      });
      dbService.persist([product1, product2]);
      await dbService.flush();

      const response = await request(httpServer)
        .get("/products")
        .query({ category: EProductCategory.ELECTRONICS })
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].title).toBe("Electronics Product");
    });

    it("should filter products by search term", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product1 = dbService.create(Product, {
        title: "iPhone 15",
        description: "Latest iPhone",
        price: 1000,
        rentalPrice: 100,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      const product2 = dbService.create(Product, {
        title: "Samsung TV",
        description: "Smart TV",
        price: 500,
        rentalPrice: 50,
        quantity: 5,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist([product1, product2]);
      await dbService.flush();

      const response = await request(httpServer)
        .get("/products")
        .query({ search: "iPhone" })
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].title).toBe("iPhone 15");
    });

    it("should filter products by price range", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product1 = dbService.create(Product, {
        title: "Cheap Product",
        description: "Test",
        price: 50,
        rentalPrice: 10,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      const product2 = dbService.create(Product, {
        title: "Expensive Product",
        description: "Test",
        price: 500,
        rentalPrice: 100,
        quantity: 5,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist([product1, product2]);
      await dbService.flush();

      const response = await request(httpServer)
        .get("/products")
        .query({ minPrice: 100, maxPrice: 600 })
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].title).toBe("Expensive Product");
    });
  });

  describe("GET /products/:id (get single product)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).get("/products/some-id");

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 404 when product not found", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .get("/products/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("should return product when found", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .get(`/products/${product.id}`)
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toMatchObject({
        id: product.id,
        title: "Test Product",
      });
    });
  });

  describe("GET /products/categories (get categories)", () => {
    it("should return categories", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const category1 = dbService.create(ProductCategory, { name: "Electronics" });
      const category2 = dbService.create(ProductCategory, { name: "Furniture" });
      dbService.persist([category1, category2]);
      await dbService.flush();

      const response = await request(httpServer)
        .get("/products/categories")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({ name: "Electronics" });
    });
  });

  describe("PATCH /products/:id (update product)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer)
        .patch("/products/some-id")
        .send({ title: "Updated" });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 404 when product not found", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .patch("/products/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ title: "Updated" });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("should return 403 when user is not the owner", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "other@example.com" });
      const bearerToken = await getBearerToken(httpServer, "other@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .patch(`/products/${product.id}`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe("You are not allowed to update this product");
    });

    it("should update product when user is owner", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .patch(`/products/${product.id}`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /products/:id (delete product)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer).delete("/products/some-id");

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 404 when product not found", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .delete("/products/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("should return 403 when user is not the owner", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "other@example.com" });
      const bearerToken = await getBearerToken(httpServer, "other@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .delete(`/products/${product.id}`)
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body.message).toBe("You are not allowed to delete this product");
    });

    it("should delete product when user is owner and no orders exist", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .delete(`/products/${product.id}`)
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data.success).toBe(true);
    });
  });

  describe("POST /products/:id/buy (buy product)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer)
        .post("/products/some-id/buy")
        .send({ quantity: 1 });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 404 when product not found", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/products/00000000-0000-0000-0000-000000000000/buy")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 1 });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("should return 400 when user tries to buy their own product", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .post(`/products/${product.id}/buy`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 1 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe("You cannot buy your own product");
    });

    it("should return 400 when quantity exceeds available stock", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "buyer@example.com" });
      const bearerToken = await getBearerToken(httpServer, "buyer@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 5,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .post(`/products/${product.id}/buy`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 10 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe("Not enough stock available");
    });

    it("should successfully purchase product", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "buyer@example.com" });
      const bearerToken = await getBearerToken(httpServer, "buyer@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .post(`/products/${product.id}/buy`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 2 });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.message).toBe("Product purchased successfully");
      expect(response.body.data.orderId).toBeDefined();
    });
  });

  describe("POST /products/:id/rent (rent product)", () => {
    it("should return 401 when no bearer token is provided", async () => {
      const response = await request(httpServer)
        .post("/products/some-id/rent")
        .send({ quantity: 1 });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it("should return 404 when product not found", async () => {
      await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const response = await request(httpServer)
        .post("/products/00000000-0000-0000-0000-000000000000/rent")
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 1 });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it("should return 400 when user tries to rent their own product", async () => {
      const user = await createUserInDb(dbService);
      const bearerToken = await getBearerToken(httpServer);

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner: user,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .post(`/products/${product.id}/rent`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 1 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe("You cannot rent your own product");
    });

    it("should return 400 when rent end date is before start date", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "buyer@example.com" });
      const bearerToken = await getBearerToken(httpServer, "buyer@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2);

      const response = await request(httpServer)
        .post(`/products/${product.id}/rent`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          quantity: 1,
          rentStartDate: startDate.toISOString().split("T")[0],
          rentEndDate: endDate.toISOString().split("T")[0],
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toContain(
        "Rent start must be today or later, and end must be on or after start.",
      );
    });

    it("should return 400 when quantity exceeds available stock", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "buyer@example.com" });
      const bearerToken = await getBearerToken(httpServer, "buyer@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 5,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .post(`/products/${product.id}/rent`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 10 });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe("Not enough stock available");
    });

    it("should successfully rent product without date range", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "buyer@example.com" });
      const bearerToken = await getBearerToken(httpServer, "buyer@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const response = await request(httpServer)
        .post(`/products/${product.id}/rent`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({ quantity: 2 });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.message).toBe("Product rented successfully");
      expect(response.body.data.orderId).toBeDefined();
    });

    it("should successfully rent product with date range", async () => {
      const owner = await createUserInDb(dbService);
      await createUserInDb(dbService, { email: "buyer@example.com" });
      const bearerToken = await getBearerToken(httpServer, "buyer@example.com");

      const product = dbService.create(Product, {
        title: "Test Product",
        description: "Test Description",
        price: 100,
        rentalPrice: 20,
        quantity: 10,
        categories: [EProductCategory.ELECTRONICS],
        owner,
      });
      dbService.persist(product);
      await dbService.flush();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const response = await request(httpServer)
        .post(`/products/${product.id}/rent`)
        .set("Authorization", `Bearer ${bearerToken}`)
        .send({
          quantity: 2,
          rentStartDate: startDate.toISOString().split("T")[0],
          rentEndDate: endDate.toISOString().split("T")[0],
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.message).toBe("Product rented successfully");
      expect(response.body.data.orderId).toBeDefined();
    });
  });
});
