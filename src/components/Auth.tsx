'use client';

import { useAuthForm } from '@/hooks/useAuthForm';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

interface FormValues {
  email: string;
  password: string;
}

const initialValues: FormValues = {
  email: '',
  password: ''
};

export default function Auth() {
  const {
    error,
    loading,
    handleSubmit
  } = useAuthForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="bg-white p-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo/logo.jpeg"
            alt="Company Logo"
            width={150}
            height={150}
            className="rounded-lg"
            priority
          />
        </div>
        <h2 className="text-2xl font-bold text-primary-dark mb-6 text-center">
          Login
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Formik<FormValues>
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched }) => (
            <Form className="space-y-4" autoComplete="off">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                  Email
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoComplete="off"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                  Password
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.password && touched.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoComplete="new-password"
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-dark text-white py-2 px-4 rounded-md hover:bg-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
} 