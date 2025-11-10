package com.example.Expense_Tracker.Controller;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<?> getMonthlyExpenses(Principal principal,
                                                @RequestParam(value = "months", required = false, defaultValue = "1") int months) {
        // if months == 1 keep legacy behavior (single BigDecimal) for backward compatibility
        if (months <= 1) {
            YearMonth currentMonth = YearMonth.now();
            BigDecimal monthlyTotal = dashboardService.getMonthlyExpenses(principal.getName(), currentMonth);
            return ResponseEntity.ok(monthlyTotal);
        }

        // return a list of recent months totals (0 = current month, 1 = previous month, ...)
        List<Map<String, Object>> list = dashboardService.getMonthlyExpensesList(principal.getName(), months);
        return ResponseEntity.ok(list);
    }
}