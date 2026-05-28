import type { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LoanStatus, PaymentType } from "../src/constants/enums";

let app: Express;
let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret-for-loan-tracker";
  process.env.CORS_ORIGIN = "*";

  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();

  app = (await import("../src/app")).app;
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Loan Tracker API", () => {
  it("handles auth, contacts, loans, payments, ownership, and dashboard calculations", async () => {
    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "test@example.com", password: "secret123" })
      .expect(201);

    expect(registered.body).toMatchObject({
      success: true,
      message: "Registered successfully",
    });

    const token = registered.body.data.token;

    const loggedIn = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "secret123" })
      .expect(200);

    expect(loggedIn.body.data.user.email).toBe("test@example.com");

    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const updatedProfile = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated User", email: "updated@example.com" })
      .expect(200);

    expect(updatedProfile.body.data).toMatchObject({
      name: "Updated User",
      email: "updated@example.com",
    });

    const contactResponse = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Ali Khan", phone: "03001234567" })
      .expect(201);

    const contactId = contactResponse.body.data._id;

    const otherUser = await request(app)
      .post("/api/auth/register")
      .send({ name: "Other User", email: "other@example.com", password: "secret123" })
      .expect(201);

    await request(app)
      .get(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${otherUser.body.data.token}`)
      .expect(404);

    const givenLoan = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contactId,
        type: "GIVEN",
        amount: 1000,
        issueDate: "2026-01-01",
        description: "Lunch settlement",
      })
      .expect(201);

    const givenLoanId = givenLoan.body.data._id;
    expect(givenLoan.body.data.remainingAmount).toBe(1000);
    expect(givenLoan.body.data.status).toBe(LoanStatus.ACTIVE);

    await request(app)
      .delete(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ loanId: givenLoanId, amount: 1200, method: "CASH" })
      .expect(400);

    const partialPayment = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ loanId: givenLoanId, amount: 400, method: "CASH" })
      .expect(201);

    const paymentId = partialPayment.body.data.payment._id;
    expect(partialPayment.body.data.payment.type).toBe(PaymentType.RECEIVED);
    expect(partialPayment.body.data.loan.paidAmount).toBe(400);
    expect(partialPayment.body.data.loan.remainingAmount).toBe(600);
    expect(partialPayment.body.data.loan.status).toBe(LoanStatus.PARTIALLY_PAID);

    const detail = await request(app)
      .get(`/api/loans/${givenLoanId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(detail.body.data.payments).toHaveLength(1);

    await request(app)
      .patch(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1001 })
      .expect(400);

    const completedPayment = await request(app)
      .patch(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1000 })
      .expect(200);

    expect(completedPayment.body.data.loan.remainingAmount).toBe(0);
    expect(completedPayment.body.data.loan.status).toBe(LoanStatus.COMPLETED);

    await request(app)
      .patch(`/api/loans/${givenLoanId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 999 })
      .expect(400);

    const takenContact = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sara Malik" })
      .expect(201);

    const takenLoan = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contactId: takenContact.body.data._id,
        type: "TAKEN",
        amount: 500,
      })
      .expect(201);

    const paidPayment = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ loanId: takenLoan.body.data._id, amount: 200, method: "BANK" })
      .expect(201);

    expect(paidPayment.body.data.payment.type).toBe(PaymentType.PAID);

    const summary = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(summary.body.data).toMatchObject({
      totalLoanGiven: 1000,
      totalLoanTaken: 500,
      totalReceivedBack: 1000,
      totalPaidBack: 200,
      netReceivable: 0,
      netPayable: 300,
      overallBalance: -300,
      completedLoans: 1,
    });

    await request(app)
      .delete(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const afterDelete = await request(app)
      .get(`/api/loans/${givenLoanId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(afterDelete.body.data.loan.remainingAmount).toBe(1000);
    expect(afterDelete.body.data.loan.status).toBe(LoanStatus.ACTIVE);

    await request(app)
      .delete(`/api/loans/${givenLoanId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/loans/${takenLoan.body.data._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/contacts/${takenContact.body.data._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
