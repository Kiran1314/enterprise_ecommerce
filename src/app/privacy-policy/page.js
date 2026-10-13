import React from 'react';
import { Box, Container, Paper, Typography, Divider, Link, Button } from '@mui/material';
import { ArrowBack  } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy - SuperRFJapan Auto Spare Parts',
  description: 'Privacy Policy for SuperRFJapan Auto Spare Parts Company.',
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
            <strong>Last Updated:</strong> [Insert Date]
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
                Since our website currently operates without a payment gateway, we only collect information necessary to process your enquiries and provide customer support. This may include:
              </Typography>
              <Box component="ul" sx={{ pl: 3, margin: 0, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <li><Typography variant="body1"><strong>Personal Identification Information:</strong> Name, email address, phone number, and company name (if applicable) provided via our contact or enquiry forms.</Typography></li>
                <li><Typography variant="body1"><strong>Enquiry Details:</strong> Specific vehicle details, part requirements, and any messages you send us.</Typography></li>
                <li><Typography variant="body1"><strong>Technical Data:</strong> IP address, browser type, device information, and website usage statistics collected through cookies or similar tracking technologies.</Typography></li>
                <li><Typography variant="body1"><strong>Note on Financial Data:</strong> We <strong>do not</strong> collect or store credit card details or payment information on this website at this time.</Typography></li>
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
                <li><Typography variant="body1">To communicate with you regarding your requests, our services, or website updates.</Typography></li>
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
                We do not sell, trade, or rent your personal information to third parties. We may share your information only under the following circumstances:
              </Typography>
              <Box component="ul" sx={{ pl: 3, margin: 0, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <li><Typography variant="body1"><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our website or conducting our business, provided they agree to keep this information confidential.</Typography></li>
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
                6. Future E-Commerce Updates
              </Typography>
              <Typography variant="body1" color="text.secondary">
                As we transition to a full e-commerce platform with a payment gateway, our data collection practices will change to include payment processing and order fulfillment. This Privacy Policy will be updated accordingly, and you will be notified of these changes.
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
                  21C Street, G Floor, 29733 96054, Naif<br />
                  Deira, Dubai Municipality, Show Entrance<br />
                  Dubai - UAE
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    <strong>Email:</strong> <Link href="mailto:[Insert Email Address]" sx={{ color: '#6600cc', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>[Insert Email Address]</Link>
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    <strong>Phone:</strong> <Link href="tel:[Insert Phone Number]" sx={{ color: '#6600cc', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>[Insert Phone Number]</Link>
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