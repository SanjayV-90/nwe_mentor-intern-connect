package com.internportal.backend.security;

import com.internportal.backend.domain.entity.User;
import com.internportal.backend.domain.enums.AccountStatus;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class CustomUserDetails implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final AccountStatus status;
    private final boolean deleted;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.status = user.getStatus();
        this.deleted = user.isDeleted();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().name()));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return !deleted;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !deleted && status != AccountStatus.DISABLED && status != AccountStatus.REJECTED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return !deleted;
    }

    @Override
    public boolean isEnabled() {
        return !deleted && status != AccountStatus.DISABLED && status != AccountStatus.REJECTED;
    }
}
