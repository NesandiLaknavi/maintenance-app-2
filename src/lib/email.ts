interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendTaskAssignmentEmail = async (
  technicianEmail: string,
  technicianName: string,
  taskDetails: {
    type: string;
    scheduledDate: string;
    priorityLevel: string;
  }
) => {
  const subject = 'New Maintenance Task Assigned';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Maintenance Task Assigned</h2>
      <p>Hello ${technicianName},</p>
      <p>A new maintenance task has been assigned to you:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Task Type:</strong> ${taskDetails.type}</p>
        <p><strong>Scheduled Date:</strong> ${taskDetails.scheduledDate}</p>
        <p><strong>Priority Level:</strong> ${taskDetails.priorityLevel}</p>
      </div>
      <p>Please log in to the maintenance system to view more details and update the task status.</p>
      <p>Best regards,<br>Maintenance Team</p>
    </div>
  `;

  return sendEmail({ to: technicianEmail, subject, html });
}; 