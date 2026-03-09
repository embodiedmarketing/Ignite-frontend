import { useEffect } from 'react';
import { apiRequest } from '@/services/queryClient';
import { API } from '@/services/apiEndpoints';

export function useAutoMigration(userId: number | string) {
  useEffect(() => {
    if (!userId) return;

    const runAutoMigration = async () => {
      const migrationKey = `migration-completed-${userId}`;
      if (localStorage.getItem(migrationKey)) return;

      try {
        const offerOutline = localStorage.getItem(`offer-outline-${userId}`);
        if (offerOutline) {
          await apiRequest("POST", API.USER_OFFER_OUTLINES_MIGRATE, {
            userId,
            outline: offerOutline,
            completeness: 100,
            missingInformation: [],
            recommendations: []
          });
        }

        // Migrate sales page drafts
        const salesPageKeys = Object.keys(localStorage).filter(key => 
          key.startsWith(`sales-page-draft-${userId}`)
        );
        
        for (const key of salesPageKeys) {
          const content = localStorage.getItem(key);
          if (content) {
            const draftNumber = key.split('-').pop() || '1';
            await apiRequest("POST", API.SALES_PAGE_DRAFTS, {
              userId,
              title: `Draft ${draftNumber}`,
              content,
              draftNumber: parseInt(draftNumber)
            });
          }
        }

        // Migrate customer experience data
        const customerResponses = localStorage.getItem(`customer-experience-responses-${userId}`);
        const customerTodos = localStorage.getItem(`customer-experience-todos-${userId}`);
        
        if (customerResponses || customerTodos) {
          await apiRequest("POST", API.CUSTOMER_EXPERIENCE, {
            userId,
            responses: customerResponses ? JSON.parse(customerResponses) : {},
            todos: customerTodos ? JSON.parse(customerTodos) : []
          });
        }

        // Mark migration as completed
        localStorage.setItem(migrationKey, 'true');
        
      } catch (error) {
        // Silent failure - migration will retry on next login
        console.log("Auto-migration partially failed (will retry):", error);
      }
    };

    // Run migration after a short delay to avoid blocking initial load
    const timer = setTimeout(runAutoMigration, 2000);
    return () => clearTimeout(timer);
  }, [userId]);
}
