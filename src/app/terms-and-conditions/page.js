import React from 'react';
import { Box, Container, Paper, Typography, Divider, Link, Button } from '@mui/material';
import { ArrowBack  } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/siteUrl';

export const metadata = {
  title: 'Terms and Conditions - SuperRFJapan Auto Spare Parts',
  description: 'Terms for product enquiries, order confirmation, payment, and delivery from Super RF Japan.',
  alternates: { canonical: `${SITE_URL}/terms-and-conditions` },
  openGraph: {
    type: 'website',
    siteName: 'SUPER RF JAPAN',
    title: 'Terms and Conditions - SuperRFJapan Auto Spare Parts',
    description: 'Terms for product enquiries, order confirmation, payment, and delivery from Super RF Japan.',
    url: `${SITE_URL}/terms-and-conditions`
  }
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
            <strong>Last Updated:</strong> 25 November 2026
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
                <li><Typography variant="body1"><strong>WhatsApp Confirmation:</strong> Product availability, fitment, specifications, price, delivery arrangements, and any applicable charges must be confirmed with our team through WhatsApp before an order is placed. A website enquiry alone is not an order.</Typography></li>
                <li><Typography variant="body1"><strong>Order Confirmation:</strong> An order is finalized only after you and our team confirm the product and order details through WhatsApp. Please check the make, model, model year, part number, and other details in the final confirmation before proceeding.</Typography></li>
                <li><Typography variant="body1"><strong>Payment:</strong> Subject to confirmation by our team, payment may be made on delivery or through a payment gateway link sent by our team. Do not make payment using a link unless you have verified it came from Super RF Japan.</Typography></li>
                <li><Typography variant="body1"><strong>Delivery:</strong> We will arrange delivery according to the product and delivery details confirmed in your WhatsApp enquiry. Delivery timing, location, and any delivery charges are confirmed with you before the order is finalized.</Typography></li>
                <li><Typography variant="body1"><strong>Returns and Exchanges:</strong> Products are not exchangeable or returnable after an order is confirmed, except where applicable law requires otherwise. Please review our <Link href="/return-policy" sx={{ color: '#6600cc' }}>Return Policy</Link> before confirming your order.</Typography></li>
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