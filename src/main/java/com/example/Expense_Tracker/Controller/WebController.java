package com.example.Expense_Tracker.Controller;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.Expense_Tracker.Model.Expense;
import com.example.Expense_Tracker.Service.ExpenseService;

@Controller
public class WebController {

    @Autowired
    private ExpenseService expenseService;

    /**
     * Redirect root to login page
     */
    @GetMapping("/")
    public String home() {
        // Spring Security will handle authentication - just redirect to dashboard
        // If not authenticated, Spring Security will redirect to login
        return "redirect:/dashboard";
    }

    /**
     * Login page
     */
    @GetMapping("/login")
    public String login() {
        // Show login page - Spring Security handles authentication
        return "auth/login";
    }

    /**
     * Registration page
     */
    @GetMapping("/register")
    public String register() {
        // Show register page - Spring Security handles authentication
        return "auth/register";
    }

    /**
     * Logout page - clear authentication and redirect to login
     */
    @GetMapping("/logout")
    public String logout() {
        return "redirect:/login";
    }

    /**
     * Dashboard page with server-side authentication
     */
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // Spring Security ensures user is authenticated to reach this point
        model.addAttribute("title", "Dashboard");
        return "dashboard";
    }

    /**
     * All expenses page with filtering and pagination
     */
    @GetMapping("/expenses")
    public String expenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            Model model) {
        
        try {
            // Parse date filters (minimal controller logic)
            LocalDate fromDate = (dateFrom != null && !dateFrom.isEmpty()) ? LocalDate.parse(dateFrom) : null;
            LocalDate toDate = (dateTo != null && !dateTo.isEmpty()) ? LocalDate.parse(dateTo) : null;
            
            // Create pageable and delegate filtering to service
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            // Get current user from service (temporary - service should use SecurityContext)
            String username = expenseService.getCurrentUser().getUsername();
            Page<Expense> expensesPage = expenseService.getFilteredExpenses(username, search, category, fromDate, toDate, pageable);
            
            // Add attributes to model (view preparation only)
            model.addAttribute("expenses", expensesPage.getContent());
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPages", expensesPage.getTotalPages());
            model.addAttribute("totalElements", expensesPage.getTotalElements());
            model.addAttribute("pageSize", size);
            model.addAttribute("search", search);
            model.addAttribute("category", category);
            model.addAttribute("dateFrom", dateFrom);
            model.addAttribute("dateTo", dateTo);
            
            boolean hasFilters = (search != null && !search.isEmpty()) ||
                               (category != null && !category.isEmpty()) ||
                               (fromDate != null) || (toDate != null);
            model.addAttribute("hasFilters", hasFilters);
            model.addAttribute("title", "All Expenses");
            return "expenses";
            
        } catch (Exception e) {
            model.addAttribute("error", "Failed to load expenses");
            return "error";
        }
    }

    /**
     * Add expense page (also handles editing)
     */
    @GetMapping("/add-expense")
    public String addExpense(@RequestParam(required = false) Long id, Model model) {
        try {
            if (id != null) {
                // Editing existing expense - delegate to service
                try {
                    Expense expense = expenseService.getExpenseById(id);
                    model.addAttribute("expense", expense);
                    model.addAttribute("title", "Edit Expense");
                } catch (RuntimeException e) {
                    model.addAttribute("error", "Expense not found");
                    return "error";
                }
            } else {
                // Creating new expense
                model.addAttribute("expense", null);
                model.addAttribute("title", "Add New Expense");
            }
            
            // Get recent expenses - use existing service method
            List<Expense> recentExpenses = expenseService.getAllExpensesForCurrentUser().stream()
                .limit(5)
                .collect(Collectors.toList());
            model.addAttribute("recentExpenses", recentExpenses);
            
            return "add-expense";
            
        } catch (Exception e) {
            model.addAttribute("error", "Failed to load expense form");
            return "error";
        }
    }

    /**
     * User profile page (future implementation)
     */
    @GetMapping("/profile")
    public String profile(Model model) {
        // Spring Security ensures user is authenticated to reach this point
        // TODO: Add user profile data
        model.addAttribute("title", "Profile");
        return "profile";
    }

    /**
     * Settings page (future implementation)
     */
    @GetMapping("/settings")
    public String settings(Model model) {
        // Spring Security ensures user is authenticated to reach this point
        // TODO: Add user settings
        model.addAttribute("title", "Settings");
        return "settings";
    }

    /**
     * Reports page (future implementation)
     */
    @GetMapping("/reports")
    public String reports(Model model) {
        // Spring Security ensures user is authenticated to reach this point
        // TODO: Add reporting functionality
        model.addAttribute("title", "Reports");
        return "reports";
    }

    /**
     * Error page
     */
    @GetMapping("/error")
    public String error(Model model) {
        model.addAttribute("title", "Error");
        return "error";
    }

    /**
     * Access denied page
     */
    @GetMapping("/access-denied")
    public String accessDenied(Model model) {
        model.addAttribute("title", "Access Denied");
        model.addAttribute("error", "You don't have permission to access this resource");
        return "error";
    }



    /**
     * Global exception handler for this controller
     */
    @ExceptionHandler(Exception.class)
    public String handleException(Exception e, Model model) {
        model.addAttribute("error", "An unexpected error occurred: " + e.getMessage());
        model.addAttribute("title", "Error");
        return "error";
    }
}