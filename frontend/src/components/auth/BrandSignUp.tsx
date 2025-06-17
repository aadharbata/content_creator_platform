import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, Heading, Text, useToast, Switch, HStack, Spinner
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const BrandSignUp = () => {
  const [form, setForm] = useState({
    gstNumber: '',
    companyName: '',
    brandName: '',
    contactPerson: '',
    email: '',
    password: '',
    confirm_password: '',
    industry: '',
    noGST: false,
  });
  const [loading, setLoading] = useState(false);
  const [gstLoading, setGstLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGSTVerify = async () => {
    if (!form.gstNumber || form.gstNumber.length !== 15) {
      toast({ status: 'error', title: 'GST number must be 15 characters.' });
      return;
    }
    setGstLoading(true);
    try {
      const res = await fetch('/api/gst/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstNumber: form.gstNumber }),
      });
      const data = await res.json();
      if (res.ok && data.legalName) {
        setForm(f => ({ ...f, companyName: data.legalName }));
        toast({ status: 'success', title: 'GST verified!' });
      } else {
        setForm(f => ({ ...f, companyName: '' }));
        toast({ status: 'error', title: data.error || 'Invalid GST number.' });
      }
    } catch (err) {
      setForm(f => ({ ...f, companyName: '' }));
      toast({ status: 'error', title: 'Failed to verify GST.' });
    }
    setGstLoading(false);
  };

  const handleNoGST = () => {
    setForm(f => ({ ...f, noGST: !f.noGST, gstNumber: '', companyName: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast({ status: 'error', title: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/brand/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstNumber: form.noGST ? '' : form.gstNumber,
          companyName: form.companyName,
          brandName: form.brandName,
          contactPerson: form.contactPerson,
          email: form.email,
          password: form.password,
          industry: form.industry,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ status: 'success', title: 'Sign up successful!' });
        navigate('/login');
      } else {
        toast({ status: 'error', title: data.message || 'Sign up failed.' });
      }
    } catch (err) {
      toast({ status: 'error', title: 'Server error.' });
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, blue.900, purple.900, orange.400)" display="flex" alignItems="center" justifyContent="center" px={2} py={8}>
      <Box bg="whiteAlpha.900" boxShadow="2xl" borderRadius="2xl" p={{ base: 10, md: 14 }} maxW="lg" w="full" textAlign="center">
        <Box bgGradient="linear(to-tr, blue.700, orange.400, purple.700)" borderRadius="full" w={16} h={16} mx="auto" mb={4} display="flex" alignItems="center" justifyContent="center" boxShadow="xl" border="4px solid white">
          <Text color="white" fontSize="2xl" fontWeight="extrabold" letterSpacing="widest">BR</Text>
        </Box>
        <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" mb={2} color="blue.900">Brand Sign Up</Heading>
        <Text color="gray.700" mb={6}>Register your brand and connect with top creators!</Text>
        <form onSubmit={handleSubmit} autoComplete="off">
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>GST Number</FormLabel>
              <HStack>
                <Input name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="Enter GSTIN (15 chars)" maxLength={15} textTransform="uppercase" isDisabled={form.noGST} />
                <Button type="button" onClick={handleGSTVerify} isDisabled={form.noGST || gstLoading} colorScheme="orange">Verify</Button>
                {gstLoading && <Spinner size="sm" />}
              </HStack>
              <HStack mt={2} alignItems="center">
                <Switch isChecked={form.noGST} onChange={handleNoGST} colorScheme="orange" />
                <Text fontSize="sm">I do not have a GST</Text>
              </HStack>
            </FormControl>
            <FormControl>
              <FormLabel>Company Name</FormLabel>
              <Input name="companyName" value={form.companyName} readOnly bg="gray.100" color="gray.700" cursor="not-allowed" placeholder="Auto-filled after GST verification" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Brand Name</FormLabel>
              <Input name="brandName" value={form.brandName} onChange={handleChange} placeholder="Brand Name" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Contact Person</FormLabel>
              <Input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Contact Person" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="brand@email.com" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Confirm Password" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Industry</FormLabel>
              <Select name="industry" value={form.industry} onChange={handleChange}>
                <option value="">Select Industry</option>
                <option value="fashion">Fashion</option>
                <option value="tech">Tech</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="media">Media</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            <Button type="submit" colorScheme="orange" size="lg" mt={4} isLoading={loading} w="full" bgGradient="linear(to-r, blue.700, orange.400, purple.700)" _hover={{ filter: 'brightness(1.1)' }}>
              Sign Up
            </Button>
          </VStack>
        </form>
        <Text mt={6} fontSize="sm" color="gray.600">
          Are you a creator or fan?{' '}
          <a href="/signup" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>Sign up as Creator or Fan</a>
        </Text>
      </Box>
    </Box>
  );
};

export default BrandSignUp; 