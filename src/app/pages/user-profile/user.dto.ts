export class UserDto {
    id: string;
    name: string;
    avatar?: string;

    constructor(id?: string, name?: string, avatar?: string) {
        this.id = id ?? "";
        this.name = name ?? "";
        this.avatar = avatar ?? "";
    }


}
