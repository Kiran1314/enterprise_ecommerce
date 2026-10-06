import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/Category';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    // Clean system fields
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    // Sanitize attributes into proper subdocument objects
    const cleanAttributes = (attrs) => {
      if (!Array.isArray(attrs)) return [];
      return attrs.map(attr => {
        if (typeof attr === 'string') {
          return { name: attr, type: 'select' };
        }
        return {
          name: attr?.name || '',
          type: attr?.type || 'select'
        };
      }).filter(a => a.name && a.name.trim() !== '');
    };

    body.attributes = cleanAttributes(body.attributes);

    if (body.subcategories && Array.isArray(body.subcategories)) {
      body.subcategories = body.subcategories.map(sub => {
        const subCopy = { ...sub };
        delete subCopy._id;
        subCopy.attributes = cleanAttributes(subCopy.attributes);
        return subCopy;
      });
    }

    // Use findById and save to fully trigger Mongoose subdocument casting and schema validations
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    category.name = body.name;
    category.slug = body.slug;
    category.icon = body.icon;
    category.description = body.description;
    category.attributes = body.attributes;
    category.subcategories = body.subcategories;

    await category.save();
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Category', entityId: category._id, description: `${admin.name} updated category ${category.name} and its subcategories.` });

    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error) {
    console.error('Error updating category API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const { id } = await params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'deleted', entityType: 'Category', entityId: category._id, description: `${admin.name} deleted category ${category.name}.` });
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}