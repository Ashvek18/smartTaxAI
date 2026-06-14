import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  User, 
  SalaryStructure, 
  TaxDeductions, 
  FinancialGoal, 
  InvestmentProduct, 
  TaxRegimeConfig, 
  AuditLog, 
  ComparisonResult 
} from "./src/types";
import { compareRegimes, DEFAULT_SLABS } from "./src/utils/taxCalcs";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), ".data", "db.json");

// Ensure .data folder exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Ensure database file exists with seed data
const initialSeedProducts: InvestmentProduct[] = [
  {
    id: "elss_1",
    name: "Equity Linked Savings Schemes (ELSS)",
    category: "ELSS",
    expectedReturns: 12,
    lockInValue: "3 Years",
    riskLevel: "High",
    taxBenefits: "Deduction under Section 80C (up to ₹1.5L)",
    description: "Diverse equity mutual funds with the shortest lock-in period. High wealth generation capacity over long runs."
  },
  {
    id: "ppf_1",
    name: "Public Provident Fund (PPF)",
    category: "PPF",
    expectedReturns: 7.1,
    lockInValue: "15 Years",
    riskLevel: "Low",
    taxBenefits: "EEE Status - Deduction under 80C & Exempt Returns",
    description: "Government-backed long-term saving product offering guaranteed interest rates and risk-free compounding."
  },
  {
    id: "nps_1",
    name: "National Pension Scheme (NPS)",
    category: "NPS",
    expectedReturns: 9.5,
    lockInValue: "Till age 60",
    riskLevel: "Medium",
    taxBenefits: "Additional ₹50,000 under Section 80CCD(1B)",
    description: "Retirement focused product with flexible exposure to equity and corporate/government bonds."
  },
  {
    id: "fd_1",
    name: "Tax Saver Fixed Deposits (5-Year)",
    category: "FD",
    expectedReturns: 6.8,
    lockInValue: "5 Years",
    riskLevel: "Low",
    taxBenefits: "Deduction under 80C. Interest is taxable",
    description: "Safe bank deposit with a fixed rate of returns. Recommended for low-risk appetite users."
  },
  {
    id: "hl_1",
    name: "Home Loan Principal repayment & Interest",
    category: "SIP",
    expectedReturns: 0,
    lockInValue: "No Lock-in",
    riskLevel: "Low",
    taxBenefits: "Principal under 80C. Interest under Section 24(b)",
    description: "Leverage home loan repayments to save taxes while building a permanent real-estate asset."
  },
  {
    id: "hi_1",
    name: "Individual & Family Health Insurance policy",
    category: "Health Insurance",
    expectedReturns: 0,
    lockInValue: "Annual Renewal",
    riskLevel: "Low",
    taxBenefits: "Deduction under Section 80D (up to ₹25,000 / ₹50,000)",
    description: "Critical safety net for self and parents, offering medical protection alongside solid tax savings."
  }
];

const standardUserSeed: User = {
  id: "user_seed_id",
  email: "user@smarttax.ai",
  name: "Rohan Sharma",
  role: "user",
  profile: {
    age: 32,
    riskAppetite: "medium",
    salary: {
      basic: 650000,
      hra: 260000,
      specialAllowance: 120000,
      lta: 40000,
      bonus: 80000,
      employerPf: 78000,
      professionalTax: 2500,
      otherComponents: 10000
    },
    deductions: {
      sec80C: 120000,
      sec80D: 15000,
      nps80CCD1B: 20000,
      homeLoanInterest: 0,
      educationLoan: 0,
      donations: 0,
      rentPaid: 180000,
      metroCity: true
    }
  },
  createdAt: new Date().toISOString()
};

const adminUserSeed: User = {
  id: "admin_seed_id",
  email: "admin@smarttax.ai",
  name: "Ashvek Padwal",
  role: "admin",
  profile: {
    age: 40,
    riskAppetite: "low",
    salary: {
      basic: 1200000,
      hra: 480000,
      specialAllowance: 200000,
      lta: 50000,
      bonus: 150000,
      employerPf: 144000,
      professionalTax: 2500,
      otherComponents: 20000
    },
    deductions: {
      sec80C: 150000,
      sec80D: 25000,
      nps80CCD1B: 50000,
      homeLoanInterest: 120000,
      educationLoan: 0,
      donations: 5000,
      rentPaid: 0,
      metroCity: false
    }
  },
  createdAt: new Date().toISOString()
};

interface DbSchema {
  users: Record<string, User & { passwordHash: string }>;
  goals: FinancialGoal[];
  config: TaxRegimeConfig;
  investmentProducts: InvestmentProduct[];
  auditLogs: AuditLog[];
}

const defaultDb: DbSchema = {
  users: {
    "user@smarttax.ai": {
      ...standardUserSeed,
      passwordHash: hashPassword("user123")
    },
    "admin@smarttax.ai": {
      ...adminUserSeed,
      passwordHash: hashPassword("admin123")
    }
  },
  goals: [
    {
      id: "goal_1",
      userId: "user_seed_id",
      name: "Retirement Fund",
      type: "retirement",
      targetAmount: 25000000,
      targetYears: 25,
      monthlyInvestment: 15000,
      currentSaved: 450000,
      timelineProgress: 15,
      suggestedInvestments: ["ELSS Funds", "NPS", "PPF"]
    },
    {
      id: "goal_2",
      userId: "user_seed_id",
      name: "Emergency Fund",
      type: "emergency",
      targetAmount: 500000,
      targetYears: 2,
      monthlyInvestment: 12000,
      currentSaved: 100000,
      timelineProgress: 20,
      suggestedInvestments: ["Liquid Mutual Funds", "Tax Saving FDs"]
    }
  ],
  config: {
    standardDeductionOld: DEFAULT_SLABS.standardDeductionOld,
    standardDeductionNew: DEFAULT_SLABS.standardDeductionNew,
    oldSlabs: DEFAULT_SLABS.oldSlabs,
    newSlabs: DEFAULT_SLABS.newSlabs
  },
  investmentProducts: initialSeedProducts,
  auditLogs: []
};

// Cryptography helper
function hashPassword(pass: string): string {
  return crypto.createHash("sha256").update(pass).digest("hex");
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load db file, using seeds:", err);
  }
  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to db file:", err);
  }
}

// Token helper for JWT simulation
const JWT_SECRET = "smarttax_secret_key_extremely_secure_2026";
function generateToken(payload: { id: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    
    const parsedBody = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (parsedBody.exp < Date.now()) return null; // Expired
    return parsedBody;
  } catch (e) {
    return null;
  }
}

// Express App configurations
app.use(express.json());

// Auth check middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Authentication certificate missing." });
  }
  const token = authHeader.split(" ")[1];
  const claims = verifyToken(token);
  if (!claims) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
  (req as any).user = claims;
  next();
}

// Admin check middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if ((req as any).user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }
    next();
  });
}

// Helper: Audit Logger
function logAudit(userId: string, email: string, action: string, details: string) {
  const db = loadDb();
  const newLog: AuditLog = {
    id: `log_${crypto.randomUUID()}`,
    userId,
    userEmail: email,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog);
  // Cap logs size at 500
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDb(db);
}

// --- API ROUTES ---

// 1. AUTHENTICATION & USER MANAGEMENT
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, age } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required profile registration parameters." });
  }
  
  const db = loadDb();
  const lowerEmail = email.toLowerCase().trim();
  if (db.users[lowerEmail]) {
    return res.status(400).json({ error: "Account with this email already exists." });
  }
  
  // Create default records
  const newUser: User = {
    id: `usr_${crypto.randomUUID()}`,
    email: lowerEmail,
    name,
    role: "user",
    profile: {
      age: Number(age) || 30,
      riskAppetite: "medium",
      salary: {
        basic: 500000,
        hra: 200000,
        specialAllowance: 100000,
        lta: 30000,
        bonus: 50000,
        employerPf: 60000,
        professionalTax: 2500,
        otherComponents: 0
      },
      deductions: {
        sec80C: 100000,
        sec80D: 15000,
        nps80CCD1B: 0,
        homeLoanInterest: 0,
        educationLoan: 0,
        donations: 0,
        rentPaid: 150000,
        metroCity: true
      }
    },
    createdAt: new Date().toISOString()
  };
  
  db.users[lowerEmail] = {
    ...newUser,
    passwordHash: hashPassword(password)
  };
  saveDb(db);
  
  logAudit(newUser.id, lowerEmail, "REGISTER", "Completed registration");
  
  const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
  res.json({ token, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  
  const db = loadDb();
  const lowerEmail = email.toLowerCase().trim();
  const userRecord = db.users[lowerEmail];
  
  if (!userRecord || userRecord.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid email credentials or incorrect password." });
  }
  
  // Exclude password from return payload
  const { passwordHash, ...userPayload } = userRecord;
  const token = generateToken({ id: userPayload.id, email: userPayload.email, role: userPayload.role });
  
  logAudit(userPayload.id, lowerEmail, "LOGIN", "Logged in successfully to system");
  res.json({ token, user: userPayload });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Registered email address is required." });
  }
  const db = loadDb();
  const lowerEmail = email.toLowerCase().trim();
  if (!db.users[lowerEmail]) {
    return res.status(404).json({ error: "No user found with this email." });
  }
  // Simulate password reset link
  logAudit(db.users[lowerEmail].id, lowerEmail, "FORGOT_PASSWORD", "Triggered password reset simulator");
  res.json({ message: "Password reset instructions sent. For sandbox preview, use standard passwords (user123, admin123)." });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  if (!userRecord) {
    return res.status(404).json({ error: "User profile was deleted or modified." });
  }
  const { passwordHash, ...userPayload } = userRecord;
  res.json({ user: userPayload });
});

app.put("/api/auth/profile", requireAuth, (req, res) => {
  const { name, age, riskAppetite, salary, deductions } = req.body;
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  
  if (!userRecord) {
    return res.status(404).json({ error: "User profile not found." });
  }
  
  if (name) userRecord.name = name;
  if (age) userRecord.profile.age = Number(age);
  if (riskAppetite) userRecord.profile.riskAppetite = riskAppetite;
  if (salary) userRecord.profile.salary = { ...userRecord.profile.salary, ...salary };
  if (deductions) userRecord.profile.deductions = { ...userRecord.profile.deductions, ...deductions };
  
  db.users[lowerEmail] = userRecord;
  saveDb(db);
  
  logAudit(userRecord.id, lowerEmail, "UPDATE_PROFILE", "Modified active salary parameters and deductions profiles");
  
  const { passwordHash, ...userPayload } = userRecord;
  res.json({ user: userPayload });
});

// 2. SALARY STRUCTURE & TAX ESTIMATION COMPARISON
app.get("/api/tax/comparison", requireAuth, (req, res) => {
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  if (!userRecord) {
    return res.status(404).json({ error: "User details missing." });
  }
  
  const comp = compareRegimes(userRecord.profile.salary, userRecord.profile.deductions, {
    standardDeductionOld: db.config.standardDeductionOld,
    standardDeductionNew: db.config.standardDeductionNew,
    oldSlabs: db.config.oldSlabs,
    newSlabs: db.config.newSlabs
  });
  
  res.json(comp);
});

// 3. TDS PROJECTION SYSTEM
app.get("/api/tds/forecast", requireAuth, (req, res) => {
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  if (!userRecord) {
    return res.status(404).json({ error: "User record missing." });
  }
  
  const comp = compareRegimes(userRecord.profile.salary, userRecord.profile.deductions, {
    standardDeductionOld: db.config.standardDeductionOld,
    standardDeductionNew: db.config.standardDeductionNew,
    oldSlabs: db.config.oldSlabs,
    newSlabs: db.config.newSlabs
  });
  
  // Decide active tax payable based on typical selection (or choose recommended)
  const regimeToUse = comp.recommendedRegime;
  const activeTaxResult = regimeToUse === "old" ? comp.oldRegime : comp.newRegime;
  const annualTax = activeTaxResult.totalTax;
  const monthlyTdsProjection = annualTax / 12;
  
  // Generate month-wise forecast array (starting from April for Indian FY)
  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
  
  // We'll mock some paid TDS (let's say 25% of tax is already deducted up to the current month June)
  const currentMonthIdx = 2; // June is index 2 in FY
  
  const monthlyBreakdown = months.map((month, idx) => {
    const isPaid = idx <= currentMonthIdx;
    return {
      month,
      forecastTds: Math.round(monthlyTdsProjection),
      status: isPaid ? "Deducted" : "Projected",
      cumulativeTaxPaid: Math.round(monthlyTdsProjection * (idx + 1)),
      remainingTaxLiability: Math.max(0, Math.round(annualTax - (monthlyTdsProjection * (idx + 1))))
    };
  });
  
  res.json({
    annualTaxPayable: annualTax,
    monthlyTds: monthlyTdsProjection,
    activeRegime: regimeToUse,
    monthlyBreakdown,
    totalDeductedSoFar: monthlyTdsProjection * (currentMonthIdx + 1),
    remainingTaxLiability: annualTax - (monthlyTdsProjection * (currentMonthIdx + 1))
  });
});

// 4. SMART INVESTMENT RECOMMENDATIONS
app.get("/api/investments/recommendations", requireAuth, (req, res) => {
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  if (!userRecord) return res.status(404).json({ error: "User missing." });
  
  // Match products based on Profile (Risk appetite, age, remaining limits)
  const userRisk = userRecord.profile.riskAppetite; // 'low' | 'medium' | 'high'
  const def11C = userRecord.profile.deductions.sec80C;
  const remaining80C = Math.max(0, 150000 - def11C);
  
  const products = db.investmentProducts;
  
  const recommendations = products.map(p => {
    let matchScore = 50;
    const isRelevantTo80C = p.taxBenefits.includes("80C");
    const isRelevantTo80D = p.taxBenefits.includes("80D");
    
    // Risk adaptation
    if (p.riskLevel.toLowerCase() === userRisk) matchScore += 25;
    else if (userRisk === "high" && p.riskLevel === "Medium") matchScore += 15;
    else if (userRisk === "medium" && p.riskLevel === "Low") matchScore += 10;
    
    // Action planning integration
    if (isRelevantTo80C && remaining80C > 20000) matchScore += 20;
    if (isRelevantTo80D && userRecord.profile.deductions.sec80D < 10000) matchScore += 15;
    
    // Age adjustment
    if (userRecord.profile.age > 45 && p.riskLevel === "Low") matchScore += 10;
    
    return {
      product: p,
      matchScore: Math.min(98, matchScore),
      priorityReason: isRelevantTo80C && remaining80C > 0 
        ? `Helps consume empty Section 80C capacity (₹${remaining80C.toLocaleString('en-IN')} remaining)`
        : isRelevantTo80D 
          ? "Secures medical welfare while qualifying for Section 80D tax exemption deduction" 
          : "Diversifies financial asset base with strong tax shield and attractive lock-in yields."
    };
  }).sort((a,b) => b.matchScore - a.matchScore);
  
  res.json({
    recommendations,
    remaining80Climit: remaining80C,
    deductionsSnapshot: userRecord.profile.deductions
  });
});

// 5. FINANCIAL GOALS PLANNING API
app.get("/api/goals", requireAuth, (req, res) => {
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  
  const userGoals = db.goals.filter(g => g.userId === userRecord.id);
  res.json(userGoals);
});

app.post("/api/goals", requireAuth, (req, res) => {
  const { name, type, targetAmount, targetYears, monthlySavings } = req.body;
  if (!name || !type || !targetAmount || !targetYears) {
    return res.status(400).json({ error: "Missing goal tracking parameters." });
  }
  
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  
  // Calculate recommended monthly compounding
  const calculatedSavings = Math.round(targetAmount / (targetYears * 12));
  
  const suggestionsMap: Record<string, string[]> = {
    home: ["ELSS Funds", "Home Loan Principal shielding", "Tax Saving FDs"],
    retirement: ["National Pension Scheme (NPS)", "Public Provident Fund (PPF)", "ELSS SIPs"],
    emergency: ["Liquid Mutual Funds", "Short-term Bank FDs"],
    car: ["Recurring Deposits", "Medium-term SIP mutual funds"],
    vacation: ["Short-term sovereign gold bonds", "Monthly Recurring Deposits"]
  };
  
  const newGoal: FinancialGoal = {
    id: `goal_${crypto.randomUUID()}`,
    userId: userRecord.id,
    name,
    type,
    targetAmount: Number(targetAmount),
    targetYears: Number(targetYears),
    monthlyInvestment: Number(monthlySavings) || calculatedSavings,
    currentSaved: 0,
    timelineProgress: 0,
    suggestedInvestments: suggestionsMap[type] || ["ELSS Funds", "NPS"]
  };
  
  db.goals.push(newGoal);
  saveDb(db);
  
  logAudit(userRecord.id, lowerEmail, "CREATE_GOAL", `Added financial goal: ${name}`);
  res.json(newGoal);
});

app.delete("/api/goals/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  
  const initialLen = db.goals.length;
  db.goals = db.goals.filter(g => !(g.id === id && g.userId === userRecord.id));
  
  if (db.goals.length === initialLen) {
    return res.status(404).json({ error: "Goal not found." });
  }
  
  saveDb(db);
  logAudit(userRecord.id, lowerEmail, "DELETE_GOAL", `Deleted goal id: ${id}`);
  res.json({ success: true });
});

// 6. AI FINANCIAL ADVISOR - Server-Side Gemini API Interaction
app.post("/api/advisor/chat", requireAuth, async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Empty prompt or conversational message input." });
  }
  
  const db = loadDb();
  const lowerEmail = (req as any).user.email;
  const userRecord = db.users[lowerEmail];
  
  if (!userRecord) {
    return res.status(404).json({ error: "User profile context missing." });
  }
  
  // Check for the Gemini API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("PLACEHOLDER")) {
    // Provide a neat pre-fabricated high-quality smart advisory mock if key is unset so sandbox preview is delightful
    return res.json({
      answer: `👋 Welcome! I am your AI tax optimization pilot. Currently, the server requires a configured \`GEMINI_API_KEY\` inside the **Secrets panel** to activate full conversational planning. Here is a baseline simulation based on your profile:

### 💼 Your Profile Summary
- **Age**: ${userRecord.profile.age} (Risk profile matches **${userRecord.profile.riskAppetite.toUpperCase()}** assets)
- **Basic Pay**: ₹${userRecord.profile.salary.basic.toLocaleString('en-IN')}
- **Annual HRA**: ₹${userRecord.profile.salary.hra.toLocaleString('en-IN')}
- **Exemption limits utilization**: 80C stands at ₹${userRecord.profile.deductions.sec80C.toLocaleString('en-IN')} utilizing **${Math.round((userRecord.profile.deductions.sec80C/150000)*100)}%** of overall capacity.

Based on standard calculations, your profile would generally benefit from **${compareRegimes(userRecord.profile.salary, userRecord.profile.deductions, db.config).recommendedRegime.toUpperCase()} METRIC REGIME** saving you up to ₹${Math.round(compareRegimes(userRecord.profile.salary, userRecord.profile.deductions, db.config).netSavings).toLocaleString('en-IN')} in total annual tax liability! 
`
    });
  }
  
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    // Construct tax context payload for model
    const comparison = compareRegimes(userRecord.profile.salary, userRecord.profile.deductions, db.config);
    const contextStr = `
You are the SmartTaxAI virtual advisor, a highly experienced and certified Indian Chartered Accountant (CA) and tax consultant.
Provide precise, compliance-aligned, and deeply educational tax guidance based strictly on the user profile below.
Do not make up fake sections, references, or calculations. Use clear markdown formatting, list priorities, and quote Section references.

### USER TAX PROFILE:
- Name: ${userRecord.name}
- Age: ${userRecord.profile.age} years (Determine Senior citizen benefits if age >= 60)
- Investment Risk Appetite: ${userRecord.profile.riskAppetite}
- Active Gross Salary: ₹${comparison.grossSalary.toLocaleString('en-IN')}
- Basic Salary: ₹${userRecord.profile.salary.basic.toLocaleString('en-IN')}
- HRA Salary: ₹${userRecord.profile.salary.hra.toLocaleString('en-IN')}
- Deductions declared:
  * Section 80C: ₹${userRecord.profile.deductions.sec80C.toLocaleString('en-IN')} (Max ₹1.5L limit)
  * Section 80D: ₹${userRecord.profile.deductions.sec80D.toLocaleString('en-IN')} (Medical policy)
  * NPS Sec 80CCD(1B): ₹${userRecord.profile.deductions.nps80CCD1B.toLocaleString('en-IN')} (Max ₹50K additional)
  * Rent Paid: ₹${userRecord.profile.deductions.rentPaid.toLocaleString('en-IN')} (${userRecord.profile.deductions.metroCity ? 'Metro City' : 'Non-Metro'})
  * Home Loan Interest Sec 24(b): ₹${userRecord.profile.deductions.homeLoanInterest.toLocaleString('en-IN')}

### CURRENT COMPARISON RESULT:
- Recommended Regime: ${comparison.recommendedRegime.toUpperCase()} Regime
- Old Regime Estimated Tax (after rebate & cess): ₹${comparison.oldRegime.totalTax.toLocaleString('en-IN')}
- New Regime Estimated Tax (after rebate & cess): ₹${comparison.newRegime.totalTax.toLocaleString('en-IN')}
- Old Regime Eligible Deductions Total: ₹${comparison.oldRegime.exemptionsAndDeductions.toLocaleString('en-IN')} (Includes Standard deduction ₹50,000, Section HRA, and Sections 80C/80D/24)
- New Regime Deductions: Standard Deduction of ₹75,000 (No exemptions like HRA, LTA or Section 80C apply)
- Delta Net Savings: ₹${comparison.netSavings.toLocaleString('en-IN')} by picking ${comparison.recommendedRegime.toUpperCase()} regime.
`;

    // Map history to simple text format if present
    let formattedHistory = "";
    if (chatHistory && Array.isArray(chatHistory)) {
      formattedHistory = chatHistory.slice(-5).map((h: any) => `${h.sender === "user" ? "User" : "Advisor"}: ${h.text}`).join("\n\n");
    }

    const mainPrompt = `
Conversation History:
${formattedHistory}

User Query: "${message}"

Write your helpful advisory response now. Focus on actionable tax optimization, detailed comparison numbers, lock-in periods of suggested investment schemes (e.g. PPF 15Y, ELSS 3Y, NPS up to 60) and how the user can increase deductions utilization to save more money under the Old regime if applicable, or why the New Regime's flat rates make it highly optimal instead. Keep the tone friendly, expert-level, and perfectly formatted. No jargon without explanations.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: mainPrompt,
      config: {
        systemInstruction: contextStr,
        temperature: 0.7
      }
    });

    logAudit(userRecord.id, lowerEmail, "AI_ADVICE", `Queried AI Advisor: ${message.slice(0, 50)}...`);
    res.json({ answer: response.text });
    
  } catch (err: any) {
    console.error("Gemini API error on server handler:", err);
    
    // Provide a neat, highly detailed, personalized local-calculator rule-based advisor fallback
    // to shield the user from transient 503, demand spikes, or quota limits
    const query = message.toLocaleLowerCase();
    const comparison = compareRegimes(userRecord.profile.salary, userRecord.profile.deductions, db.config);
    const risk = userRecord.profile.riskAppetite || "moderate";
    
    let fallbackText = `⚠️ *Note: The primary AI cloud network is currently experiencing high model demand. To protect your productivity, I have seamlessly activated our local rule-based financial advisory engine.*

---

`;

    if (query.includes("old") || query.includes("new") || query.includes("regime") || query.includes("choose") || query.includes("difference") || query.includes("compare")) {
      fallbackText += `### ⚖️ Tax Regime Analysis for ${userRecord.name}

Based on standard Income Tax regulations and your current profile configurations:
* **Gross CTC / Salary**: ₹${comparison.grossSalary.toLocaleString('en-IN')}
* **Old Regime Total Tax Liability**: ₹${Math.round(comparison.oldRegime.totalTax).toLocaleString('en-IN')}
* **New Regime Total Tax Liability**: ₹${Math.round(comparison.newRegime.totalTax).toLocaleString('en-IN')}
* **⭐ Best Recommended Choice**: Use the **${comparison.recommendedRegime.toUpperCase()}** Regime.
* **Estimated Annual Savings**: **₹${Math.round(comparison.netSavings).toLocaleString('en-IN')}**

#### Strategic Breakdown & Structural Differences:
1. **New Regime**:
   * Features lower flat tax rates across 6 simplified slabs.
   * Includes a default **Standard Deduction of ₹75,000**.
   * Removes almost all common exemptions (No Section 10HRA, Section 80C, or Section 80D apply).
   * **Verdict**: Best if you prefer direct high liquidity, simplified paperless filing, or have low investment capacities.

2. **Old Regime**:
   * Features standard higher rate slabs (reaches 30% after ₹10 Lakhs).
   * Supports a **Standard Deduction of ₹50,000**.
   * Allows claiming Section 80C (up to ₹1.5L), Section 80D (health policies), Section 10(13A) (HRA exemptions), and Section 24(b) (Home Loan Interest up to ₹2L).
   * **Verdict**: Highly optimal ONLY if you utilize extensive investments and deductions to significantly trim down taxable salary.`;
    } else if (query.includes("80c") || query.includes("deduction") || query.includes("maximize") || query.includes("save") || query.includes("limit")) {
      const current80C = userRecord.profile.deductions.sec80C || 0;
      const remaining80C = Math.max(0, 150000 - current80C);
      const utilizationPercent = Math.min(100, Math.round((current80C / 150000) * 100));

      fallbackText += `### 🎯 Section 80C Maximizer Map

Your active Section 80C declaration stands at **₹${current80C.toLocaleString('en-IN')}** out of the maximum **₹1,50,000** ceiling limit (**${utilizationPercent}%** utilized).
* Remaining Capacity: **₹${remaining80C.toLocaleString('en-IN')}**

#### Recommended Strategic Actions to Maximize Section 80C:
1. **ELSS (Equity Linked Savings Schemes)**:
   * **Lock-in Period**: 3 Years (Lowest among all 80C options).
   * **Returns**: Historically 12-15% CAGR (Market-linked).
   * **Recommendation**: Excellent fit for your **${risk.toUpperCase()}** risk profile. Allows building wealth while saving taxes.

2. **PPF (Public Provident Fund)**:
   * **Lock-in Period**: 15 Years (Partial withdrawals allowed from Year 6).
   * **Returns**: 7.1% per annum (Guaranteed & completely tax-exempt at exit).
   * **Recommendation**: Good for conservative allocation.

3. **EPF / VPF (Provident Funds)**:
   * High interest rate of 8.25% p.a.
   * Ask your payroll HR department to deduct Voluntary Provident Fund (VPF) if you wish to securely absorb your remaining capacity of ₹${remaining80C.toLocaleString('en-IN')}.`;
    } else if (query.includes("portfolio") || query.includes("risk") || query.includes("suggest") || query.includes("investment") || query.includes("plan")) {
      fallbackText += `### 📈 Personalized Tax-Saving & Wealth-Building Portfolio

For a user with age **${userRecord.profile.age}** and a **${risk.toUpperCase()}** risk appetite, we recommend structuring your savings split as follows:

#### Suggested Allocation Breakdown:
1. **Equity Linked Savings Schemes (ELSS Mutual Funds)**:
   * Allocate **${risk === 'high' ? '60%' : risk === 'medium' ? '40%' : '15%'}** of tax investments here.
   * Compounding potential is maximised. Always prefer Monthly SIPs over lump sum for cost averaging.

2. **National Pension Scheme (NPS - Sec 80CCD(1B))**:
   * Allocate up to **₹50,000** in this separate retirement bucket.
   * Grants an exclusive deduction above the standard Section 80C basket. Perfect for dynamic tax-deductions.

3. **Public Provident Fund (PPF) or Sukanya Samriddhi Yojana (SSY)**:
   * Allocate **${risk === 'high' ? '20%' : risk === 'medium' ? '40%' : '70%'}** to safe secure options.
   * Guarantees capital safety and reliable interest growth in debt markets.

*Next Steps*: Review these products and add them in the "Deductions & Investments" screen to see direct, updated simulations of your net take-home salary!`;
    } else if (query.includes("hra") || query.includes("rent") || query.includes("metro") || query.includes("house") || query.includes("10(13a)")) {
      const basic = userRecord.profile.salary.basic || 0;
      const totalHRA = userRecord.profile.salary.hra || 0;
      const rent = userRecord.profile.deductions.rentPaid || 0;
      const metro = userRecord.profile.deductions.metroCity || false;

      fallbackText += `### 🏠 HRA Exemption Sec 10(13A) Calculator

Under Section 10(13A) of the IT Act, HRA tax exemption is computed as the **least** of the following three math components:
1. **Actual HRA received** from employer: **₹${totalHRA.toLocaleString('en-IN')}**
2. **Excess Rent Paid** over 10% of Basic Pay: **₹${Math.max(0, rent - (basic * 0.1)).toLocaleString('en-IN')}**
3. **Metro / Non-Metro Base Factor** (${metro ? "50%" : "40%"} of Basic Pay): **₹${(basic * (metro ? 0.5 : 0.4)).toLocaleString('en-IN')}**

* **Your Calculated Net HRA Exemption**: **₹${Math.round(comparison.hraExemption).toLocaleString('en-IN')}**
* Taxable HRA Component: **₹${Math.max(0, totalHRA - Math.round(comparison.hraExemption)).toLocaleString('en-IN')}**

#### 🔑 Compliance Checklist for HRA Claim validation:
* **Rent Receipts & Agreements**: Ensure you have a signed Tenant agreement.
* **Landlord PAN Mandatory**: If your annual rent exceeds ₹1,00,000 (roughly ₹8,333/month), your landlord's PAN must be supplied to HR to claim this exemption during corporate TDS cycles.`;
    } else {
      fallbackText += `### 💡 Personalized Advisory Baseline Report for ${userRecord.name}

To assist you immediately while the primary AI cloud channel is busy, here is your customized tax-savings dashboard outline:

#### 📋 Quick Metrics:
* **Recommended Regime Choice**: **${comparison.recommendedRegime.toUpperCase()} Regime**
* **Projected Net Tax Savings**: **₹${Math.round(comparison.netSavings).toLocaleString('en-IN')}** by switching.
* **Age group rules**: Active under the standard non-senior citizen slabs (Age: ${userRecord.profile.age}).

#### Recommended Priority Actions:
1. **Verify Section 80C**: Check your "Deductions & Investments" screen. If you have underutilized space in your ₹1.5 Lakh ceiling, invest in ELSS or PPF.
2. **Review NPS Contribution**: Investing ₹50,000 in Section 80CCD(1B) provides direct high rebate power on the old regime.
3. **Ask Detailed Questions**: Ask me about "Section 80C maximizing", "HRA calculations", "investment portfolios", or "differences between old and new regimes"!`;
    }

    logAudit(userRecord.id, lowerEmail, "AI_ADVICE_FALLBACK", `Gemini 503 fallback serving: ${message.slice(0, 50)}...`);
    res.json({ answer: fallbackText });
  }
});

// 7. ADMIN PANEL APIs
// Fetch Slab Configuration details
app.get("/api/admin/config", requireAdmin, (req, res) => {
  const db = loadDb();
  res.json(db.config);
});

// Update Slab configurations
app.put("/api/admin/config", requireAdmin, (req, res) => {
  const { standardDeductionOld, standardDeductionNew, oldSlabs, newSlabs } = req.body;
  const db = loadDb();
  
  if (standardDeductionOld !== undefined) db.config.standardDeductionOld = Number(standardDeductionOld);
  if (standardDeductionNew !== undefined) db.config.standardDeductionNew = Number(standardDeductionNew);
  if (oldSlabs) db.config.oldSlabs = oldSlabs;
  if (newSlabs) db.config.newSlabs = newSlabs;
  
  saveDb(db);
  logAudit((req as any).user.id, (req as any).user.email, "UPDATE_SLAB_CONFIG", "Modified default tax slabs or standard deduction limits globally");
  res.json({ message: "Default tax slab configurations updated successfully.", config: db.config });
});

// Fetch Audit logs
app.get("/api/admin/logs", requireAdmin, (req, res) => {
  const db = loadDb();
  res.json(db.auditLogs);
});

// Fetch Investment Products
app.get("/api/admin/products", requireAdmin, (req, res) => {
  const db = loadDb();
  res.json(db.investmentProducts);
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const { name, category, expectedReturns, lockInValue, riskLevel, taxBenefits, description } = req.body;
  if (!name || !category || expectedReturns === undefined || !lockInValue || !riskLevel || !taxBenefits) {
    return res.status(400).json({ error: "Missing required investment product definition." });
  }
  const db = loadDb();
  const newProd: InvestmentProduct = {
    id: `prod_${crypto.randomUUID()}`,
    name,
    category,
    expectedReturns: Number(expectedReturns),
    lockInValue,
    riskLevel,
    taxBenefits,
    description: description || ""
  };
  db.investmentProducts.push(newProd);
  saveDb(db);
  
  logAudit((req as any).user.id, (req as any).user.email, "CREATE_PRODUCT", `Added investment scheme product: ${name}`);
  res.json(newProd);
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const initialLen = db.investmentProducts.length;
  db.investmentProducts = db.investmentProducts.filter(p => p.id !== id);
  if (db.investmentProducts.length === initialLen) {
    return res.status(404).json({ error: "Product not found." });
  }
  saveDb(db);
  logAudit((req as any).user.id, (req as any).user.email, "DELETE_PRODUCT", `Removed product index: ${id}`);
  res.json({ success: true });
});

// Fetch all register users
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const db = loadDb();
  const userList = Object.values(db.users).map(({ passwordHash, ...safePayload }) => safePayload);
  res.json(userList);
});

// --- PLATFORM CLIENT INTEGRATION MIDDLEWARES ---

// Vite client server integration (only mounted for development / preview)
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Serve HTML page
    app.get("*", (req, res) => {
      const htmlFile = path.resolve(process.cwd(), "index.html");
      res.sendFile(htmlFile);
    });
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SmartTaxAI Dev Server running on port ${PORT}`);
    });
  });
} else {
  // Static files server for production builds
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartTaxAI Prod Server running on port ${PORT}`);
  });
}
