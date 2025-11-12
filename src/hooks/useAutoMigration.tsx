import { useEffect } from 'react';
import { apiRequest } from '@/services/queryClient';

export function useAutoMigration(userId: number | string) {
  useEffect(() => {
    if (!userId) return;

    const runAutoMigration = async () => {
      // Check if migration has already been completed
      const migrationKey = `migration-completed-${userId}`;
      if (localStorage.getItem(migrationKey)) {
        return; // Already migrated
      }

      try {
        // Migrate offer outline
        const offerOutline = localStorage.getItem(`offer-outline-${userId}`);
        if (offerOutline) {
          await apiRequest("/api/user-offer-outlines", "POST", {
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
            await apiRequest("/api/sales-page-drafts", "POST", {
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
          await apiRequest("/api/customer-experience", "POST", {
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
