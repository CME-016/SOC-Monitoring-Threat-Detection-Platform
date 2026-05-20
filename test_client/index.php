<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vulnerable Test Shop</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .product {
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn {
            background-color: #2563eb;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
        }
        .btn:hover { background-color: #1d4ed8; }
        
        /* Hacker Panel */
        .hacker-panel {
            margin-top: 40px;
            padding: 20px;
            background-color: #0f172a;
            color: #38bdf8;
            border-radius: 8px;
            font-family: monospace;
        }
        .hacker-panel h2 { color: #f43f5e; margin-top: 0; }
        .attack-btn {
            background-color: #e11d48;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .attack-btn:hover { background-color: #be123c; }
        .safe-btn {
            background-color: #10b981;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        .safe-btn:hover { background-color: #059669; }
    </style>
</head>
<body>

<div class="container">
    <h1>Welcome to My Test Shop</h1>
    <p>This is a simple client website used to test the CyberGuard SOC Dashboard.</p>

    <div class="product">
        <div>
            <h3>Secure Laptop Pro</h3>
            <p>Price: $1200</p>
        </div>
        <button class="btn" onclick="alert('Item added to cart!')">Buy Now</button>
    </div>

    <div class="product">
        <div>
            <h3>Encrypted USB Drive</h3>
            <p>Price: $45</p>
        </div>
        <button class="btn" onclick="alert('Item added to cart!')">Buy Now</button>
    </div>

    <!-- HACKER PANEL FOR TESTING -->
    <div class="hacker-panel">
        <h2>SOC Test Control Panel (Simulation)</h2>
        <p>Click these buttons to generate logs and simulate attacks on this site:</p>
        
        <button class="safe-btn" onclick="window.location.href='index.php?action=normal_visit'">🟢 Normal Visit</button>
        
        <button class="attack-btn" onclick="window.location.href='index.php?id=1\' OR \'1\'=\'1'">🔴 Simulate SQL Injection</button>
        
        <button class="attack-btn" onclick="window.location.href='index.php?search=<script>alert(1)</script>'">🔴 Simulate XSS Attack</button>
        
        <button class="attack-btn" onclick="window.location.href='index.php?file=../../etc/passwd'">🔴 Simulate File Traversal</button>
    </div>
</div>

</body>
</html>
