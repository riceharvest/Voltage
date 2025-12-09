import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface FeedbackData {
  rating: number;
  feedback: string;
  category: string;
  page: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

export async function POST(request: Request) {
  try {
    const feedback: FeedbackData = await request.json();

    // Validate required fields
    if (!feedback.feedback || feedback.feedback.trim().length === 0) {
      return NextResponse.json(
        { error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    // Create feedback directory if it doesn't exist
    const feedbackDir = path.join(process.cwd(), 'data', 'feedback');
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `feedback_${timestamp}.json`;
    const filePath = path.join(feedbackDir, filename);

    // Save feedback to file
    fs.writeFileSync(filePath, JSON.stringify(feedback, null, 2));

    // In a production app, you might want to:
    // 1. Store in a database
    // 2. Send to analytics service
    // 3. Send email notifications
    // 4. Integrate with customer support tools

    return NextResponse.json(
      { message: 'Feedback submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const feedbackDir = path.join(process.cwd(), 'data', 'feedback');

    if (!fs.existsSync(feedbackDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(feedbackDir).filter(file => file.endsWith('.json'));
    const feedback = files.map(file => {
      try {
        const filePath = path.join(feedbackDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as FeedbackData;
      } catch (error) {
        console.error(`Error reading feedback file ${file}:`, error);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}