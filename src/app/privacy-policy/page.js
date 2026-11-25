import React from 'react';
import { Box, Container, Paper, Typography, Divider, Link, Button } from '@mui/material';
import { ArrowBack  } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/siteUrl';

export const metadata = {
  title: 'Privacy Policy - SuperRFJapan Auto Spare Parts',
  description: 'Learn how Super RF Japan handles personal information submitted through product enquiries and order communications.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    type: 'website',
    siteName: 'SUPER RF JAPAN',
    title: 'Privacy Policy - SuperRFJapan Auto Spare Parts',
    description: 'Learn how Super RF Japan handles personal information submitted through product enquiries and order communications.',
    url: `${SITE_URL}/privacy-policy`
  }
};

export default function PrivacyPolicyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />

      {/* Back to Home Link */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                <Button 
                  component={Link} 
                  href="/" 
                  startIcon={<ArrowBack />} 
                  sx={{ 
                    color: 'text.secondary', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    marginLeft: 50,
                    '&:hover': { color: '#BD5E22', bgcolor: 'transparent' }, 
                    
                  }}
                >
                  Back to Home
                </Button>
              </Box>

      <Container maxWidth="lg" sx={{ py: 6, flexGrow: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight="bold" color="#0f172a" gutterBottom>
            Privacy Policy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>Last Updated:</strong> 25 November 2026
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.primary', lineHeight: 1.7 }}>
            <strong>SuperRFJapan Auto Spare Parts Company</strong> respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our enquiry-based website.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Section 1 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                1. Information We Collect
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                We collect information needed to respond to product enquiries, confirm orders, arrange delivery, and provide customer support. This may include:
              </Typography>
              <Box component="ul" sx={{ pl: 3, margin: 0, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <li><Typography variant="body1"><strong>Personal Identification Information:</strong> Name, email address, phone number, and company name (if applicable) provided via our contact or enquiry forms.</Typography></li>
                <li><Typography variant="body1"><strong>Enquiry Details:</strong> Specific vehicle details, part requirements, and any messages you send us.</Typography></li>
                <li><Typography variant="body1"><strong>Technical Data:</strong> IP address, browser type, device information, and website usage statistics collected through cookies or similar tracking technologies.</Typography></li>
                <li><Typography variant="body1"><strong>Payment Information:</strong> If you pay on delivery, payment is handled at delivery. If our team sends a payment gateway link, payment details are entered with the payment provider; we do not ask you to send card details through WhatsApp or email.</Typography></li>
              </Box>
            </Box>

            <Divider />

            {/* Section 2 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                2. How We Use Your Information
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                We use the collected information for the following purposes:
              </Typography>
              <Box component="ul" sx={{ pl: 3, margin: 0, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <li><Typography variant="body1">To respond to your product enquiries and provide accurate quotations.</Typography></li>
                <li><Typography variant="body1">To communicate with you through WhatsApp or other contact channels about enquiries, order confirmation, payment instructions, and delivery.</Typography></li>
                <li><Typography variant="body1">To improve our website&apos;s functionality, user experience, and product offerings.</Typography></li>
              </Box>
            </Box>

            <Divider />

            {/* Section 3 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                3. Information Sharing and Disclosure
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                We do not sell, trade, or rent your personal information to third parties. We may share information only as needed in the following circumstances:
              </Typography>
              <Box component="ul" sx={{ pl: 3, margin: 0, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <li><Typography variant="body1"><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our website or conducting our business, provided they agree to keep this information confidential.</Typography></li>
                <li><Typography variant="body1"><strong>Order Services:</strong> With payment providers when you use a payment link, and delivery providers when needed to fulfill an order.</Typography></li>
                <li><Typography variant="body1"><strong>Legal Requirements:</strong> If required by law, regulation, or legal process within the UAE.</Typography></li>
              </Box>
            </Box>

            <Divider />

            {/* Section 4 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                4. Data Security
              </Typography>
              <Typography variant="body1" color="text.secondary">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, please note that no method of transmission over the Internet is 100% secure.
              </Typography>
            </Box>

            <Divider />

            {/* Section 5 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                5. Cookies
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Our website may use &quot;cookies&quot; to enhance the user experience. You can choose to set your web browser to refuse cookies or to alert you when cookies are being sent. If you do so, some parts of the site may not function properly.
              </Typography>
            </Box>

            <Divider />

            {/* Section 6 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                6. Payments and Order Processing
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Orders are confirmed with our team through WhatsApp. Payment may be made on delivery or through a payment gateway link provided by our team. Payment providers process payments under their own privacy policies; please review those policies before submitting payment information. We do not request payment card details by WhatsApp or email.
              </Typography>
            </Box>

            <Divider />

            {/* Section 7 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                7. Contact Us
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </Typography>
              
              <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="body1" color="text.primary">
                  <strong>SuperRFJapan Auto Spare Parts Company</strong><br />
                  SHARJAH AL KHAN ROD INDUSTRIAL AREA NO 2<br />
                  BAGLAF BILDING NEAR BAGLAF MOSQUE
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    <strong>Email:</strong> <Link href="mailto:Saleemkhan02017@gmail.com" sx={{ color: '#6600cc', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Saleemkhan02017@gmail.com</Link>
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    <strong>Phone / WhatsApp:</strong> <Link href="tel:+971507675420" sx={{ color: '#6600cc', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>+971507675420</Link>
                  </Typography>
                </Box>
              </Box>
            </Box>

          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}