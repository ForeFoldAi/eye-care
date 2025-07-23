import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Knowledge Base Article Model (you'll need to create this)
interface KnowledgeArticle {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'draft' | 'published' | 'archived';
  views: number;
  rating: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface KnowledgeCategory {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
  totalViews: number;
  createdAt: string;
}

// Mock data for demonstration (replace with actual MongoDB models)
let mockArticles: KnowledgeArticle[] = [
  {
    _id: '1',
    title: 'How to Set Up Your First Hospital',
    content: `# Setting Up Your First Hospital

## Overview
This comprehensive guide will walk you through the process of setting up your first hospital in our healthcare management system. Follow these steps to get your hospital operational quickly and efficiently.

## Prerequisites
- Valid business license
- Hospital registration documents
- Admin user credentials
- Internet connection

## Step-by-Step Setup

### 1. Initial Registration
1. Visit the registration page
2. Enter your hospital details
3. Upload required documents
4. Verify your email address

### 2. Configure Basic Settings
- Set your hospital name and address
- Configure timezone and working hours
- Set up contact information
- Define your service areas

### 3. Add Departments
- Create medical departments
- Assign department heads
- Set up department schedules
- Configure department-specific settings

### 4. User Management
- Create admin accounts
- Add doctor profiles
- Set up receptionist accounts
- Configure user permissions

### 5. System Configuration
- Set up appointment slots
- Configure billing settings
- Set up notification preferences
- Test the system

## Best Practices
- Start with essential departments only
- Train your staff before going live
- Have a backup plan for technical issues
- Document your setup process

## Support
If you encounter any issues during setup, contact our support team immediately.`,
    category: 'getting-started',
    tags: ['setup', 'hospital', 'first-time', 'configuration'],
    author: {
      _id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    status: 'published',
    views: 1247,
    rating: 4.8,
    helpfulCount: 89,
    notHelpfulCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    publishedAt: '2024-01-15T10:00:00Z'
  },
  {
    _id: '2',
    title: 'Managing User Permissions and Roles',
    content: `# User Permissions and Role Management

## Understanding Roles
Our system supports multiple user roles with different permission levels:

### Master Admin
- Full system access
- Can manage all hospitals
- System configuration rights
- User management across all hospitals

### Hospital Admin
- Hospital-specific management
- Department and staff management
- Financial oversight
- Reporting access

### Doctor
- Patient management
- Appointment scheduling
- Medical records access
- Prescription management

### Receptionist
- Patient registration
- Appointment booking
- Payment processing
- Basic reporting

## Setting Up Permissions

### 1. Role Assignment
1. Go to User Management
2. Select the user
3. Choose appropriate role
4. Save changes

### 2. Custom Permissions
- Enable/disable specific features
- Set data access limits
- Configure notification preferences
- Set approval workflows

### 3. Department-Specific Access
- Assign users to departments
- Set department-level permissions
- Configure cross-department access
- Manage department hierarchies

## Security Best Practices
- Use strong passwords
- Enable two-factor authentication
- Regular permission audits
- Monitor user activity
- Implement least privilege principle

## Troubleshooting
Common issues and solutions for permission management.`,
    category: 'features',
    tags: ['permissions', 'users', 'roles', 'security', 'access-control'],
    author: {
      _id: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    },
    status: 'published',
    views: 892,
    rating: 4.6,
    helpfulCount: 67,
    notHelpfulCount: 5,
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    publishedAt: '2024-01-10T14:30:00Z'
  },
  {
    _id: '3',
    title: 'Troubleshooting Login Issues',
    content: `# Common Login Issues and Solutions

## Problem: "Invalid Credentials" Error

### Possible Causes:
1. Incorrect username or password
2. Account locked due to multiple failed attempts
3. Account deactivated
4. Browser cache issues

### Solutions:
1. **Check Credentials**
   - Verify username spelling
   - Ensure caps lock is off
   - Try typing password in a text editor first

2. **Reset Password**
   - Click "Forgot Password" link
   - Check email for reset instructions
   - Create a new strong password

3. **Clear Browser Cache**
   - Clear cookies and cache
   - Try incognito/private mode
   - Use a different browser

4. **Contact Support**
   - If account is locked
   - If reset email doesn't arrive
   - For persistent issues

## Problem: "Session Expired" Error

### Solutions:
1. Refresh the page
2. Log in again
3. Check your internet connection
4. Clear browser data

## Problem: Two-Factor Authentication Issues

### Solutions:
1. Check your authenticator app
2. Use backup codes if available
3. Contact admin for reset
4. Verify device time settings

## Prevention Tips
- Use strong, unique passwords
- Enable two-factor authentication
- Keep your email updated
- Log out from shared computers
- Regular password updates

## Still Having Issues?
Contact our support team with:
- Screenshot of the error
- Browser and version
- Steps to reproduce
- Account email address`,
    category: 'troubleshooting',
    tags: ['login', 'authentication', 'password', 'troubleshooting', 'support'],
    author: {
      _id: 'user3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike@example.com'
    },
    status: 'published',
    views: 2156,
    rating: 4.7,
    helpfulCount: 156,
    notHelpfulCount: 12,
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-20T16:45:00Z',
    publishedAt: '2024-01-08T09:00:00Z'
  },
  {
    _id: '4',
    title: 'API Authentication Guide',
    content: `# API Authentication and Integration

## Overview
Our healthcare management system provides a comprehensive REST API for integration with third-party applications and custom solutions.

## Authentication Methods

### 1. Bearer Token Authentication
\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     https://api.healthcare.com/v1/patients
\`\`\`

### 2. API Key Authentication
\`\`\`bash
curl -H "X-API-Key: YOUR_API_KEY" \\
     https://api.healthcare.com/v1/appointments
\`\`\`

## Getting Started

### 1. Generate API Credentials
1. Log into your admin panel
2. Navigate to API Settings
3. Generate new API key
4. Copy the key securely

### 2. Set Up Authentication
\`\`\`javascript
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'application/json'
};
\`\`\`

### 3. Make Your First Request
\`\`\`javascript
fetch('https://api.healthcare.com/v1/patients', {
  method: 'GET',
  headers: headers
})
.then(response => response.json())
.then(data => console.log(data));
\`\`\`

## Available Endpoints

### Patients
- GET /v1/patients - List patients
- POST /v1/patients - Create patient
- GET /v1/patients/{id} - Get patient details
- PUT /v1/patients/{id} - Update patient
- DELETE /v1/patients/{id} - Delete patient

### Appointments
- GET /v1/appointments - List appointments
- POST /v1/appointments - Create appointment
- PUT /v1/appointments/{id} - Update appointment
- DELETE /v1/appointments/{id} - Cancel appointment

### Doctors
- GET /v1/doctors - List doctors
- GET /v1/doctors/{id}/availability - Get availability

## Rate Limits
- 1000 requests per hour per API key
- 100 requests per minute per endpoint
- Contact support for higher limits

## Error Handling
\`\`\`json
{
  "error": "Invalid API key",
  "code": 401,
  "message": "Please provide a valid API key"
}
\`\`\`

## Best Practices
- Store API keys securely
- Implement proper error handling
- Use HTTPS for all requests
- Monitor rate limits
- Keep SDKs updated

## Support
For API support, contact our technical team with:
- API key (masked)
- Request details
- Error responses
- Integration requirements`,
    category: 'api',
    tags: ['api', 'authentication', 'integration', 'rest', 'webhooks'],
    author: {
      _id: 'user4',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah@example.com'
    },
    status: 'published',
    views: 1876,
    rating: 4.9,
    helpfulCount: 134,
    notHelpfulCount: 8,
    createdAt: '2024-01-05T11:30:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    publishedAt: '2024-01-05T11:30:00Z'
  },
  {
    _id: '5',
    title: 'Understanding Your Bill and Payment Options',
    content: `# Billing and Payment Guide

## Understanding Your Bill

### Bill Components
1. **Consultation Fees** - Doctor consultation charges
2. **Procedure Costs** - Medical procedures and treatments
3. **Medication Charges** - Prescribed medications
4. **Lab Tests** - Diagnostic tests and results
5. **Room Charges** - Inpatient accommodation (if applicable)
6. **Additional Services** - Any extra services provided

### Payment Methods
- **Credit/Debit Cards** - Visa, MasterCard, American Express
- **Bank Transfer** - Direct bank transfers
- **Cash Payment** - In-person cash payments
- **Insurance** - Direct billing to insurance providers
- **Payment Plans** - Monthly installment options

## Payment Process

### 1. Bill Generation
- Bills are generated after each visit
- Itemized breakdown provided
- Digital copy sent to email
- Available in patient portal

### 2. Payment Options
- **Immediate Payment** - Pay at the time of service
- **Online Payment** - Pay through patient portal
- **Phone Payment** - Call billing department
- **Mail Payment** - Send check or money order

### 3. Payment Confirmation
- Receipt sent via email
- Payment recorded in system
- Insurance claims processed (if applicable)
- Follow-up appointments scheduled

## Insurance Information

### Accepted Insurance
- Major health insurance providers
- Medicare and Medicaid
- Private insurance plans
- International insurance

### Insurance Process
1. Provide insurance information
2. Verify coverage
3. Submit claims automatically
4. Handle co-pays and deductibles
5. Process insurance payments

## Payment Plans

### Eligibility
- Available for bills over $500
- Good payment history required
- Credit check may be required
- Minimum monthly payment applies

### Plan Options
- 3-month payment plan
- 6-month payment plan
- 12-month payment plan
- Custom payment arrangements

## Disputes and Appeals

### If You Disagree with Your Bill
1. Contact billing department
2. Provide supporting documentation
3. Request bill review
4. Appeal process if needed
5. Payment plan options available

## Contact Information
- **Billing Department**: (555) 123-4567
- **Email**: billing@healthcare.com
- **Hours**: Monday-Friday, 8 AM - 6 PM
- **Online**: Patient portal billing section

## FAQ
**Q: Can I pay my bill online?**
A: Yes, you can pay through our secure patient portal.

**Q: Do you accept payment plans?**
A: Yes, we offer flexible payment plans for qualifying bills.

**Q: How do I update my insurance information?**
A: You can update it through the patient portal or by calling us.`,
    category: 'billing',
    tags: ['billing', 'payment', 'insurance', 'fees', 'payment-plans'],
    author: {
      _id: 'user5',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david@example.com'
    },
    status: 'published',
    views: 3421,
    rating: 4.5,
    helpfulCount: 234,
    notHelpfulCount: 18,
    createdAt: '2024-01-03T08:15:00Z',
    updatedAt: '2024-01-22T10:30:00Z',
    publishedAt: '2024-01-03T08:15:00Z'
  },
  {
    _id: '6',
    title: 'Security Best Practices for Healthcare Data',
    content: `# Healthcare Data Security Guide

## Overview
Protecting patient data is our top priority. This guide outlines security best practices for healthcare organizations using our system.

## Data Protection Standards

### HIPAA Compliance
- All data encrypted in transit and at rest
- Access controls and audit trails
- Regular security assessments
- Staff training on privacy practices

### Data Encryption
- **In Transit**: TLS 1.3 encryption
- **At Rest**: AES-256 encryption
- **Backup**: Encrypted backups
- **API**: Secure API communications

## User Security

### Password Requirements
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common words or patterns
- Regular password updates

### Two-Factor Authentication
- Required for all admin accounts
- Optional for regular users
- Multiple authentication methods
- Backup codes provided

### Session Management
- Automatic session timeout
- Concurrent session limits
- Secure logout process
- Activity monitoring

## Access Controls

### Role-Based Access
- Principle of least privilege
- Department-specific access
- Time-based access controls
- Emergency access procedures

### Audit Logging
- All access attempts logged
- User activity tracking
- Failed login monitoring
- Regular audit reviews

## Physical Security

### Device Security
- Encrypted hard drives
- Automatic screen locks
- Secure disposal procedures
- Mobile device management

### Network Security
- Firewall protection
- Intrusion detection
- Regular security updates
- Network monitoring

## Incident Response

### Security Breach Protocol
1. Immediate incident assessment
2. Containment procedures
3. Notification to authorities
4. Patient notification (if required)
5. Investigation and remediation
6. Prevention measures

### Reporting Security Issues
- Security@healthcare.com
- 24/7 security hotline
- Anonymous reporting option
- Rapid response team

## Compliance Requirements

### Regular Assessments
- Annual security audits
- Penetration testing
- Vulnerability assessments
- Compliance reviews

### Documentation
- Security policies
- Incident response plans
- Training records
- Audit reports

## Training and Awareness

### Staff Training
- Annual security training
- HIPAA compliance training
- Phishing awareness
- Incident response training

### Security Awareness
- Regular security updates
- Best practice reminders
- Threat intelligence sharing
- Security newsletters

## Contact Information
- **Security Team**: security@healthcare.com
- **Emergency**: (555) 911-SECURITY
- **Compliance**: compliance@healthcare.com

## Resources
- Security policy documents
- Training materials
- Compliance checklists
- Incident response procedures`,
    category: 'security',
    tags: ['security', 'hipaa', 'compliance', 'encryption', 'privacy'],
    author: {
      _id: 'user6',
      firstName: 'Lisa',
      lastName: 'Chen',
      email: 'lisa@example.com'
    },
    status: 'published',
    views: 1654,
    rating: 4.8,
    helpfulCount: 98,
    notHelpfulCount: 6,
    createdAt: '2024-01-12T13:45:00Z',
    updatedAt: '2024-01-25T09:15:00Z',
    publishedAt: '2024-01-12T13:45:00Z'
  }
];

let mockCategories: KnowledgeCategory[] = [
  {
    _id: 'getting-started',
    name: 'Getting Started',
    description: 'Essential guides to get you up and running quickly',
    icon: 'BookOpen',
    color: 'blue',
    articleCount: 15,
    totalViews: 8500,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'features',
    name: 'Features & How-to',
    description: 'Detailed guides for all platform features',
    icon: 'Settings',
    color: 'green',
    articleCount: 28,
    totalViews: 12000,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Solutions for common issues and problems',
    icon: 'AlertTriangle',
    color: 'red',
    articleCount: 22,
    totalViews: 9800,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'api',
    name: 'API Documentation',
    description: 'Complete API reference and integration guides',
    icon: 'Code',
    color: 'purple',
    articleCount: 18,
    totalViews: 7500,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'billing',
    name: 'Billing & Payments',
    description: 'Information about billing, invoices, and payments',
    icon: 'CreditCard',
    color: 'yellow',
    articleCount: 12,
    totalViews: 4200,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'security',
    name: 'Security & Privacy',
    description: 'Security best practices and privacy information',
    icon: 'Shield',
    color: 'indigo',
    articleCount: 8,
    totalViews: 3200,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Get all articles with filtering
router.get('/articles', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { search, category, status } = req.query;
    
    let filteredArticles = [...mockArticles];
    
    // Search filter
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Category filter
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    
    // Status filter
    if (status && status !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.status === status);
    }
    
    res.json({
      success: true,
      articles: filteredArticles
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching articles' 
    });
  }
});

// Get single article by ID
router.get('/articles/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const article = mockArticles.find(a => a._id === id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching article' 
    });
  }
});

// Create new article
router.post('/articles', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, content, category, tags, status } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }
    
    const newArticle: KnowledgeArticle = {
      _id: Date.now().toString(),
      title,
      content,
      category,
      tags: tags || [],
      author: {
        _id: req.user?.id || 'unknown',
        firstName: 'Unknown',
        lastName: 'User',
        email: 'unknown@example.com'
      },
      status: status || 'draft',
      views: 0,
      rating: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: status === 'published' ? new Date().toISOString() : undefined
    };
    
    mockArticles.push(newArticle);
    
    res.status(201).json({
      success: true,
      article: newArticle
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating article' 
    });
  }
});

// Update article
router.put('/articles/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, status } = req.body;
    
    const articleIndex = mockArticles.findIndex(a => a._id === id);
    
    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    const updatedArticle = {
      ...mockArticles[articleIndex],
      title: title || mockArticles[articleIndex].title,
      content: content || mockArticles[articleIndex].content,
      category: category || mockArticles[articleIndex].category,
      tags: tags || mockArticles[articleIndex].tags,
      status: status || mockArticles[articleIndex].status,
      updatedAt: new Date().toISOString(),
      publishedAt: status === 'published' && mockArticles[articleIndex].status !== 'published' 
        ? new Date().toISOString() 
        : mockArticles[articleIndex].publishedAt
    };
    
    mockArticles[articleIndex] = updatedArticle;
    
    res.json({
      success: true,
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating article' 
    });
  }
});

// Delete article
router.delete('/articles/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const articleIndex = mockArticles.findIndex(a => a._id === id);
    
    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    mockArticles.splice(articleIndex, 1);
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting article' 
    });
  }
});

// Get all categories
router.get('/categories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    res.json({
      success: true,
      categories: mockCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories' 
    });
  }
});

// Create new category
router.post('/categories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    const newCategory: KnowledgeCategory = {
      _id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      icon: icon || 'BookOpen',
      color: color || 'blue',
      articleCount: 0,
      totalViews: 0,
      createdAt: new Date().toISOString()
    };
    
    mockCategories.push(newCategory);
    
    res.status(201).json({
      success: true,
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating category' 
    });
  }
});

// Get knowledge base statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const totalArticles = mockArticles.length;
    const publishedArticles = mockArticles.filter(a => a.status === 'published').length;
    const totalViews = mockArticles.reduce((sum, article) => sum + article.views, 0);
    const avgRating = mockArticles.length > 0 
      ? mockArticles.reduce((sum, article) => sum + article.rating, 0) / mockArticles.length 
      : 0;
    
    const categoryStats = mockCategories.map(category => {
      const categoryArticles = mockArticles.filter(a => a.category === category._id);
      return {
        name: category.name,
        count: categoryArticles.length,
        views: categoryArticles.reduce((sum, article) => sum + article.views, 0)
      };
    });
    
    const popularArticles = [...mockArticles]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(article => ({
        title: article.title,
        views: article.views,
        rating: article.rating
      }));
    
    res.json({
      success: true,
      stats: {
        totalArticles,
        publishedArticles,
        totalViews,
        avgRating,
        categoryStats,
        popularArticles
      }
    });
  } catch (error) {
    console.error('Error fetching knowledge base stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching knowledge base statistics' 
    });
  }
});

export default router; 