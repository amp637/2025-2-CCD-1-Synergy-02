package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "event_name_table")
public class EventNameEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long enno;

    @Column(nullable = false, length = 20)
    private String name;
}