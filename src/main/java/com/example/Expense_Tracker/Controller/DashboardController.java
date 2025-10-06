package com.example.Expense_Tracker.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Expense_Tracker.Model.Expense;
import com.example.Expense_Tracker.Service.DashboardService;
import com.example.Expense_Tracker.Service.ExpenseService;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;
    
    @Autowired
    private ExpenseService expenseService;

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getDashboardStatistics() {
        try {
            String username = expenseService.getCurrentUser().getUsername();
            Map<String, Object> statistics = dashboardService.getDashboardStatistics(username);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/recent-expenses")
    public ResponseEntity<List<Expense>> getRecentExpenses() {
        try {
            String username = expenseService.getCurrentUser().getUsername();
            List<Expense> recentExpenses = dashboardService.getRecentExpenses(username);
            return ResponseEntity.ok(recentExpenses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<List<Map<String, Object>>> getCategoryBreakdown() {
        try {
            String username = expenseService.getCurrentUser().getUsername();
            List<Map<String, Object>> categoryBreakdown = dashboardService.getCategoryBreakdown(username);
            return ResponseEntity.ok(categoryBreakdown);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/monthly-expenses")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyExpenses() {
        try {
            String username = expenseService.getCurrentUser().getUsername();
            java.time.YearMonth currentMonth = java.time.YearMonth.now();
            List<Map<String, Object>> monthlyExpenses = (List<Map<String, Object>>) dashboardService.getMonthlyExpenses(username, currentMonth);
            return ResponseEntity.ok(monthlyExpenses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}