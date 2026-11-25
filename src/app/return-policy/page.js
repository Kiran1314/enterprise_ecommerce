import React from 'react';
import { Box, Container, Paper, Typography, Divider, Link, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE_URL } from '@/lib/siteUrl';

const title = 'Return and Exchange Policy - Super RF Japan';
const description = 'Review Super RF Japan’s enquiry, order confirmation, payment, delivery, and non-returnable product policy.';

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/return-policy` },
  openGraph: {
    type: 'website',
    siteName: 'SUPER RF JAPAN',
    title,
    description,
    url: `${SITE_URL}/return-policy`
  }
};

export default function ReturnPolicyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBack />}
          sx={{ mb: 3, color: 'text.secondary', textTransform: 'none', '&:hover': { color: '#BD5E22', bgcolor: 'transparent' } }}
        >
          Back to Home
        </Button>

        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight="bold" color="#0f172a" gutterBottom>
            Return and Exchange Policy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>Last Updated:</strong> 25 November 2026
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
            Please read this policy and verify all product and vehicle details with our team before confirming an order. Products are non-returnable and non-exchangeable after order confirmation, except where applicable law requires otherwise.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Enquiry and order confirmation</Typography>
              <Typography color="text.secondary">
                Contact our team through WhatsApp to confirm product availability, compatibility, part number, price, delivery arrangements, and any applicable charges. A website enquiry or WhatsApp question by itself does not place an order. Your order is finalized only after you and our team confirm the complete order details through WhatsApp.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Check product and vehicle details</Typography>
              <Typography color="text.secondary">
                Before confirming, check the product description and the vehicle make, model, model year, part number, and any other fitment details shared with our team. We prepare the order and delivery according to the details confirmed in your enquiry. Contact us before confirmation if anything is unclear or needs correction.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Payment and delivery</Typography>
              <Typography color="text.secondary">
                Once the order details are confirmed, payment can be made on delivery where available, or our team may send you a payment gateway link. Delivery arrangements, location, timing, and any charges will be confirmed with you before the order is finalized. Only use payment links verified as sent by our team.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Non-returnable and non-exchangeable products</Typography>
              <Typography color="text.secondary">
                Please choose carefully: confirmed orders cannot be returned or exchanged, including for a change of mind or a fitment issue where the product supplied matches the details confirmed for the order. If you believe the item delivered does not match the confirmed order or arrived damaged, contact us promptly with your order details and photos so our team can review the issue. This does not limit any rights that cannot be excluded under applicable law.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Contact us</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                For an enquiry about an order or this policy, contact Super RF Japan:
              </Typography>
              <Typography color="text.primary">
                <strong>Store Address:</strong> SHARJAH AL KHAN ROD INDUSTRIAL AREA NO 2 BAGLAF BILDING NEAR BAGLAF MOSQUE
              </Typography>
              <Typography color="text.primary">
                <strong>Phone / WhatsApp:</strong> <Link href="tel:+971507675420">+971507675420</Link>
              </Typography>
              <Typography color="text.primary">
                <strong>Email:</strong> <Link href="mailto:Saleemkhan02017@gmail.com">Saleemkhan02017@gmail.com</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}
