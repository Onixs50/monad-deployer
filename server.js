const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

const DATA_DIR = './data/';

// ایجاد پوشه داده‌ها (اگر وجود نداشته باشد)
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// مسیر تست برای بررسی اجرای سرور
app.get('/', (req, res) => {
    res.send("✅ Server is running!");
});

// دریافت قراردادهای دیپلوی‌شده برای یک کیف پول خاص
app.get('/contracts/:wallet', (req, res) => {
    try {
        const wallet = req.params.wallet;
        const filePath = `${DATA_DIR}${wallet}.json`;

        if (!fs.existsSync(filePath)) {
            console.log(`🔴 No exact match found for wallet: ${wallet}`);

            // بررسی همه فایل‌ها برای یافتن کیف پول موردنظر (در صورت تفاوت در حروف بزرگ و کوچک)
            const files = fs.readdirSync(DATA_DIR);
            const matchedFile = files.find(file => file.toLowerCase() === `${wallet.toLowerCase()}.json`);

            if (matchedFile) {
                console.log(`🟢 Found matching file: ${matchedFile}`);
                return res.json(JSON.parse(fs.readFileSync(`${DATA_DIR}${matchedFile}`, 'utf-8')));
            }

            return res.json([]); // اگر فایل پیدا نشد
        }

        const data = fs.readFileSync(filePath, 'utf-8');
        const contracts = JSON.parse(data);

        console.log(`🟢 Loaded contracts for ${wallet}:`, contracts);
        res.json(contracts);
    } catch (error) {
        console.error("🔴 Error reading contract data:", error);
        res.status(500).send("Server error");
    }
});

// ذخیره قرارداد جدید برای یک کیف پول خاص
app.post('/contracts', (req, res) => {
    try {
        const { wallet, contractData } = req.body;
        if (!wallet || !contractData) return res.status(400).send('Invalid data');

        const filePath = `${DATA_DIR}${wallet}.json`;
        let contracts = [];

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            contracts = JSON.parse(data);
        }

        contracts.push(contractData);
        fs.writeFileSync(filePath, JSON.stringify(contracts, null, 2));

        console.log(`🟢 Contract saved for wallet: ${wallet}`);
        res.json({ success: true, contractData });
    } catch (error) {
        console.error("🔴 Error saving contract data:", error);
        res.status(500).send("Server error");
    }
});

// حذف اطلاعات ذخیره‌شده فقط برای یک کیف پول خاص
app.delete('/contracts/:wallet', (req, res) => {
    try {
        const wallet = req.params.wallet;
        const filePath = `${DATA_DIR}${wallet}.json`;

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🟢 Data deleted for wallet: ${wallet}`);
        } else {
            console.log(`🔴 No data found to delete for wallet: ${wallet}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("🔴 Error deleting contract data:", error);
        res.status(500).send("Server error");
    }
});

// راه‌اندازی سرور روی پورت 3000
app.listen(3000, () => console.log('✅ Server running on port 3000'));
