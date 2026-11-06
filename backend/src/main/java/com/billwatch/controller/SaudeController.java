package com.billwatch.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SaudeController {

    @GetMapping("/saude")
    public String saude() {
        return "ok";
    }
}
