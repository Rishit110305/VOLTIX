import { resolveChannels } from "../utils/channelResolver.js";
import { resolveRecipients } from "../utils/recipientResolver.js";
import { dispatch } from "../utils/dispatcher.js";

export const decisionEngine = async ({ eventType, payload, context, io }) => {
  try {
    console.log(`Decision Engine triggered: ${eventType}`);
    
    const recipients = await resolveRecipients(eventType, payload);
    const channels = resolveChannels(eventType, payload);
    
    console.log(`Dispatching to ${recipients.length} recipients via channels:`, channels);
    
    for (const recipient of recipients) {
      await dispatch({ 
        io, 
        recipient, 
        eventType, 
        payload, 
        channels,
        context 
      });
    }
    
    return {
      success: true,
      recipientCount: recipients.length,
      channels
    };
  } catch (error) {
    console.error('Decision Engine error:', error);
    throw error;
  }
};