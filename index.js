require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function generateFibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  
  let fib = [0, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  return fib;
}

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function filterPrimes(arr) {
  return arr.filter(num => isPrime(num));
}

function calculateGCD(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function calculateHCF(arr) {
  return arr.reduce((acc, num) => calculateGCD(acc, num));
}

function calculateLCM(arr) {
  const gcd = (a, b) => calculateGCD(a, b);
  const lcm = (a, b) => (a * b) / gcd(a, b);
  return arr.reduce((acc, num) => lcm(acc, num));
}

// AI Function using Gemini
async function getAIResponse(question) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: `Answer this question in exactly ONE WORD only. No punctuation, no explanation, just one word: ${question}`
        }]
      }]
    });

    const answer = response.data.candidates[0].content.parts[0].text.trim();
    return answer.split(/\s+/)[0].replace(/[^\w]/g, '');
    
  } catch (error) {
    console.error('AI Error:', error.response?.data || error.message);
    throw new Error('AI service unavailable');
  }
}

app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL
  });
});

app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body;

    const keys = Object.keys(body);
    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        message: 'Exactly one key required: fibonacci, prime, lcm, hcf, or AI'
      });
    }

    const key = keys[0];
    let data;

    switch (key) {
      case 'fibonacci':
        if (typeof body.fibonacci !== 'number' || body.fibonacci < 0) {
          return res.status(400).json({
            is_success: false,
            message: 'Fibonacci requires a non-negative integer'
          });
        }
        data = generateFibonacci(body.fibonacci);
        break;

      case 'prime':
        if (!Array.isArray(body.prime)) {
          return res.status(400).json({
            is_success: false,
            message: 'Prime requires an array of integers'
          });
        }
        data = filterPrimes(body.prime);
        break;

      case 'lcm':
        if (!Array.isArray(body.lcm) || body.lcm.length === 0) {
          return res.status(400).json({
            is_success: false,
            message: 'LCM requires a non-empty array of integers'
          });
        }
        data = calculateLCM(body.lcm);
        break;

      case 'hcf':
        if (!Array.isArray(body.hcf) || body.hcf.length === 0) {
          return res.status(400).json({
            is_success: false,
            message: 'HCF requires a non-empty array of integers'
          });
        }
        data = calculateHCF(body.hcf);
        break;

      case 'AI':
        if (typeof body.AI !== 'string' || body.AI.trim() === '') {
          return res.status(400).json({
            is_success: false,
            message: 'AI requires a non-empty question string'
          });
        }
        data = await getAIResponse(body.AI);
        break;

      default:
        return res.status(400).json({
          is_success: false,
          message: 'Invalid key. Use: fibonacci, prime, lcm, hcf, or AI'
        });
    }

    res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data: data
    });

  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({
      is_success: false,
      message: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});