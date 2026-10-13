import React from 'react';
import { Box, Container, Paper, Typography, Divider, Link, Button } from '@mui/material';
import { ArrowBack  } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms and Conditions - SuperRFJapan Auto Spare Parts',
  description: 'Terms and Conditions for SuperRFJapan Auto Spare Parts Company.',
};

export default function TermsAndConditionsPage() {
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
            Terms and Conditions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>Last Updated:</strong> [Insert Date]
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.primary', lineHeight: 1.7 }}>
            Welcome to <strong>SuperRFJapan Auto Spare Parts Company</strong>. These Terms and Conditions govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Section 1 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                1. General Use
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This website provides an online catalog for quality replacement parts and automotive essentials. Currently, this platform operates on an enquiry basis. You may browse our inventory and submit requests for quotes or further information.
              </Typography>
            </Box>

            <Divider />

            {/* Section 2 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                2. Product Enquiries and Orders
              </Typography>
              <Box component="ul" sx={{ pl: 3, margin: 0, color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <li><Typography variant="body1"><strong>Enquiry Process:</strong> Submitting an enquiry through our website does not constitute a binding purchase agreement. It is a request for a formal quotation and availability check.</Typography></li>
                <li><Typography variant="body1"><strong>Pricing and Availability:</strong> All prices, specifications, and availability provided in response to an enquiry are subject to change without notice until a final sales agreement is confirmed offline.</Typography></li>
                <li><Typography variant="body1"><strong>Future E-Commerce Integration:</strong> We are in the process of upgrading to a fully-fledged e-commerce platform. Once online payment gateways are integrated, these Terms and Conditions will be updated to reflect direct online purchasing, shipping policies, and payment terms.</Typography></li>
              </Box>
            </Box>

            <Divider />

            {/* Section 3 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                3. Intellectual Property
              </Typography>
              <Typography variant="body1" color="text.secondary">
                All content on this website, including text, graphics, logos, images, and product descriptions, is the property of SuperRFJapan Auto Spare Parts Company and is protected by applicable copyright and trademark laws. Unauthorized use, reproduction, or distribution is strictly prohibited.
              </Typography>
            </Box>

            <Divider />

            {/* Section 4 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                4. Limitation of Liability
              </Typography>
              <Typography variant="body1" color="text.secondary">
                While we strive to ensure the accuracy of the information on our website, we do not warrant that product descriptions, part numbers, or other content are entirely error-free. We shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use of our website or reliance on its content. Ensure all part specifications are verified with our sales team prior to finalizing a purchase.
              </Typography>
            </Box>

            <Divider />

            {/* Section 5 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                5. Governing Law
              </Typography>
              <Typography variant="body1" color="text.secondary">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the Emirate of Dubai and the federal laws of the United Arab Emirates. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Dubai.
              </Typography>
            </Box>

            <Divider />

            {/* Section 6 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                6. Modifications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                We reserve the right to update or modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website.
              </Typography>
            </Box>

            <Divider />

            {/* Section 7 */}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ mb: 1.5 }}>
                7. Contact Information
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                For any questions regarding these Terms, please contact us:
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