# 🌐 Domain Configuration Guide

## Domain Information

**Primary Domain:** api.csediualumni.com  
**Purpose:** REST API for CSE DIU Alumni Services  
**SSL/TLS:** Let's Encrypt (Auto-renewed)

---

## ✅ Configuration Checklist

### 1. DNS Configuration

- [x] Create A record pointing `api.csediualumni.com` to EC2 public IP
- [x] Wait for DNS propagation (5-30 minutes)
- [x] Verify: `dig api.csediualumni.com`

### 2. EC2 Setup

- [x] Launch Ubuntu 22.04 EC2 instance
- [x] Configure security groups (ports: 22, 80, 443, 3000)
- [x] Run `./scripts/ec2-setup.sh`
- [x] Ensure application is running: `docker-compose ps`

### 3. Nginx & SSL Setup

- [x] Run `./scripts/setup-nginx.sh`
- [x] Obtain SSL certificate with Certbot
- [x] Verify HTTPS is working: `https://api.csediualumni.com`
- [x] Check SSL auto-renewal: `sudo systemctl status certbot.timer`

### 4. GitHub Configuration

- [x] Add GitHub secrets (EC2_HOST, SSH keys, Docker credentials)
- [x] Test CI/CD pipeline with a push to main
- [x] Verify deployment in GitHub Actions

---

## 📋 DNS Records

### Required Records

| Type | Name | Value           | TTL |
| ---- | ---- | --------------- | --- |
| A    | api  | [EC2 Public IP] | 300 |

### Optional Records (for future)

| Type  | Name    | Value                | TTL |
| ----- | ------- | -------------------- | --- |
| AAAA  | api     | [EC2 IPv6]           | 300 |
| CNAME | www.api | api.csediualumni.com | 300 |

---

## 🔒 SSL Certificate Details

**Provider:** Let's Encrypt  
**Certificate Location:** `/etc/letsencrypt/live/api.csediualumni.com/`  
**Auto-Renewal:** Enabled via systemd timer  
**Validity:** 90 days (auto-renews at 30 days)

### Certificate Files

```
/etc/letsencrypt/live/api.csediualumni.com/
├── fullchain.pem      # Full certificate chain
├── privkey.pem        # Private key
├── cert.pem           # Certificate only
└── chain.pem          # Chain only
```

### Manual Renewal (if needed)

```bash
sudo certbot renew
sudo certbot renew --dry-run  # Test renewal
```

---

## 🔍 Verification Commands

### Check DNS Resolution

```bash
# Using dig
dig api.csediualumni.com

# Using nslookup
nslookup api.csediualumni.com

# Check from multiple locations
curl https://dns.google/resolve?name=api.csediualumni.com
```

### Check SSL Certificate

```bash
# View certificate details
openssl s_client -connect api.csediualumni.com:443 -servername api.csediualumni.com

# Check expiration
echo | openssl s_client -servername api.csediualumni.com -connect api.csediualumni.com:443 2>/dev/null | openssl x509 -noout -dates

# Online checker
# https://www.ssllabs.com/ssltest/analyze.html?d=api.csediualumni.com
```

### Test API Endpoint

```bash
# HTTP (should redirect to HTTPS)
curl -I http://api.csediualumni.com

# HTTPS
curl -I https://api.csediualumni.com

# Full response
curl https://api.csediualumni.com

# Health check
./scripts/health-check.sh
```

---

## 🌐 Nginx Configuration

**Config File:** `/etc/nginx/sites-available/api.csediualumni.com`  
**Enabled:** `/etc/nginx/sites-enabled/api.csediualumni.com`

### Key Features

- ✅ HTTP to HTTPS redirect
- ✅ SSL/TLS termination
- ✅ Reverse proxy to localhost:3000
- ✅ WebSocket support
- ✅ Security headers
- ✅ Request logging
- ✅ Health check endpoint

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/api.csediualumni.com.access.log
sudo tail -f /var/log/nginx/api.csediualumni.com.error.log
```

---

## 🚨 Troubleshooting

### Domain not resolving

```bash
# Check DNS propagation
dig api.csediualumni.com
nslookup api.csediualumni.com

# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Check from EC2
curl -I http://localhost:3000
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew --nginx

# Test renewal
sudo certbot renew --dry-run

# View Certbot logs
sudo journalctl -u certbot
```

### 502 Bad Gateway

```bash
# Check if app is running
docker-compose ps

# Check app logs
docker-compose logs

# Restart application
docker-compose restart

# Check Nginx can reach app
curl http://localhost:3000
```

### Connection timeout

```bash
# Check security group allows ports 80 and 443
# From AWS Console → EC2 → Security Groups

# Check firewall
sudo ufw status

# Check if Nginx is running
sudo systemctl status nginx
```

---

## 📊 Monitoring

### Health Checks

```bash
# Application health
./scripts/health-check.sh

# Nginx status
sudo systemctl status nginx

# SSL certificate expiry
sudo certbot certificates

# Docker containers
docker-compose ps
```

### Logs

```bash
# Application logs
docker-compose logs -f

# Nginx access logs
sudo tail -f /var/log/nginx/api.csediualumni.com.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/api.csediualumni.com.error.log

# System logs
sudo journalctl -u nginx -f
```

---

## 🔄 Updates & Maintenance

### Update DNS Record

1. Update A record to new EC2 IP
2. Wait for propagation
3. Update SSL certificate if needed

### Certificate Renewal

Auto-renewal is configured via systemd timer:

```bash
# Check timer status
sudo systemctl status certbot.timer

# View next renewal time
sudo certbot certificates
```

### Domain Migration

If moving to a new domain:

1. Update Nginx configuration
2. Obtain new SSL certificate
3. Update GitHub secrets
4. Update documentation

---

## 📞 Support

For domain-related issues:

- **DNS Issues:** Contact domain registrar
- **SSL Issues:** Check Certbot logs and documentation
- **Nginx Issues:** Review configuration and logs
- **Application Issues:** Check Docker logs and GitHub Actions

**Quick Links:**

- Let's Encrypt: https://letsencrypt.org/docs/
- Certbot: https://certbot.eff.org/
- Nginx Docs: https://nginx.org/en/docs/

---

**Current Status:** ✅ api.csediualumni.com configured and operational

Last Updated: November 11, 2025
